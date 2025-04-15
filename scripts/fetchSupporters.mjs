import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const BMC_API_BASE = 'https://developers.buymeacoffee.com/api/v1';
const ACCESS_TOKEN = process.env.BMC_ACCESS_TOKEN;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DB_DIR, 'supporters.db');

if (!ACCESS_TOKEN) {
  console.error('Error: BMC_ACCESS_TOKEN not found in environment variables.');
  process.exit(1);
}

// Helper function to fetch paginated data
async function fetchPaginatedData(endpoint) {
  let allData = [];
  let url = `${BMC_API_BASE}${endpoint}`;
  let page = 1;

  console.log(`Fetching data from ${endpoint}...`);

  try {
    while (url) {
      console.log(`  Fetching page ${page}...`);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed for ${url}: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        allData = allData.concat(result.data);
      } else {
         console.warn(`Warning: No 'data' array found or invalid format in response from ${url}`);
         // Handle cases where the structure might differ or be empty
         if (result && typeof result === 'object' && !Array.isArray(result.data)) {
             console.log(`Response received: ${JSON.stringify(result, null, 2)}`);
         }
      }


      // Check for pagination
      url = result.next_page_url; // BMC API uses next_page_url
      page++;
    }
    console.log(`Successfully fetched ${allData.length} records from ${endpoint}.`);
    return allData;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error; // Re-throw to stop the process if fetching fails
  }
}

// Renamed main function and exported it
export async function updateSupportersDatabase() {
  console.log('Starting supporter update process...');

  let db; // Declare db outside try block to make it accessible in catch/finally

  try {
    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) {
      console.log(`Creating directory: ${DB_DIR}`);
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // Initialize database
    console.log(`Initializing database at: ${DB_PATH}`);
    db = new Database(DB_PATH, { verbose: console.log }); // Assign to db declared outside
    db.pragma('journal_mode = WAL'); // Recommended for better concurrency

    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS supporters (
        name TEXT PRIMARY KEY
      )
    `);
    console.log('Database table initialized.');

    // Fetch data from both endpoints
    const [oneTimeSupporters, members] = await Promise.all([
      fetchPaginatedData('/supporters'),
      fetchPaginatedData('/subscriptions?status=all') // Fetch all members (active/inactive)
    ]);

    // Combine and extract unique names
    const allSupporters = [...oneTimeSupporters, ...members];
    const names = new Set();

    allSupporters.forEach(supporter => {
      // Use 'payer_name' as it seems consistent across both endpoints
      const name = supporter.payer_name?.trim();
      if (name) { // Ensure name is not null, undefined, or empty after trimming
        names.add(name);
      } else {
        // console.log('Skipping supporter with missing or empty name:', supporter);
      }
    });

    const uniqueNames = Array.from(names);
    console.log(`Found ${uniqueNames.length} unique supporter names.`);

    // Update database within a transaction
    console.log('Updating database...');
    const updateDb = db.transaction((namesToInsert) => {
      const clearStmt = db.prepare('DELETE FROM supporters');
      clearStmt.run();
      console.log('Cleared existing supporters.');

      const insertStmt = db.prepare('INSERT OR IGNORE INTO supporters (name) VALUES (?)');
      let insertedCount = 0;
      for (const name of namesToInsert) {
        const info = insertStmt.run(name);
        if (info.changes > 0) {
            insertedCount++;
        }
      }
      console.log(`Inserted ${insertedCount} new unique names.`);
      return insertedCount; // Return count for logging if needed
    });

    const count = updateDb(uniqueNames);
    console.log(`Database update complete. ${count} names processed.`);

    // Close the database connection
    db.close();
    console.log('Database connection closed.');
    console.log('Supporter update process finished successfully.');

  } catch (error) {
    console.error('An error occurred during the supporter update process:', error);
    // Ensure DB connection is closed even if an error occurs
    if (typeof db !== 'undefined' && db.open) {
      db.close();
      console.log('Database connection closed due to error.');
    }
    // process.exit(1); // Don't exit the process in a library function
    throw error; // Re-throw the error so the caller (scheduler) knows it failed
  }
}

// // Run the update process - REMOVED
// updateSupporters(); 