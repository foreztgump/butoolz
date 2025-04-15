import cron from 'node-cron';
import { updateSupportersDatabase } from './fetchSupporters.mjs';

console.log('Scheduler started. Will run updateSupportersDatabase every 15 minutes.');

// Schedule the task to run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled task: updateSupportersDatabase');
  try {
    await updateSupportersDatabase();
    console.log('Scheduled task completed successfully.');
  } catch (error) {
    console.error('Scheduled task failed:', error);
    // Decide on error handling: retry? notify?
  }
});

// Keep the script running (optional, pm2 handles this)
// console.log('Scheduler process running...');
// process.stdin.resume(); // Keep process alive 