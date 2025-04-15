import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Construct the path to the database file relative to the project root
const DB_PATH = path.resolve(process.cwd(), 'data', 'supporters.db');

export async function GET(request: Request) {
  console.log(`API route GET /api/supporters called. DB path: ${DB_PATH}`);

  // Check if the database file exists before attempting to connect
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database file not found at:', DB_PATH);
    // Return an empty list or appropriate error if the DB doesn't exist yet
    // This might happen if the fetch script hasn't run successfully
    return NextResponse.json({ error: 'Supporter database not found.', names: [] }, { status: 500 });
  }

  let db;
  try {
    // Connect to the database - read-only is sufficient
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    db.pragma('journal_mode = WAL'); // Good practice even for readonly

    console.log('Successfully connected to database.');

    // Prepare and run the query
    const stmt = db.prepare('SELECT name FROM supporters ORDER BY name ASC'); // Order alphabetically
    const rows = stmt.all(); // Returns an array of objects like [{ name: 'Alice' }, { name: 'Bob' }]

    console.log(`Found ${rows.length} supporters in the database.`);

    // Extract just the names into a simple array
    const names = rows.map((row: any) => row.name);

    // Close the connection
    db.close();
    console.log('Database connection closed.');

    // Return the list of names
    return NextResponse.json({ names });

  } catch (error) {
    console.error('Error accessing supporter database:', error);

    // Ensure the connection is closed in case of error
    if (db && db.open) {
      db.close();
      console.log('Database connection closed due to error.');
    }

    return NextResponse.json({ error: 'Failed to retrieve supporter list.', names: [] }, { status: 500 });
  }
}

// Optional: Add revalidation if needed, though data is updated by the external script
// export const revalidate = 60; // Revalidate every 60 seconds if desired 