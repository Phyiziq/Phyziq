import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { initDb } from './db';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

/**
 * 27.2 Implement background sync worker (React Native)
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const db = await initDb();
    
    // Grab pending logs
    const pendingLogs = await db.getAllAsync(`SELECT * FROM local_workout_logs WHERE sync_status = 'pending'`);
    
    if (pendingLogs.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Attempt to push to backend
    const response = await fetch('https://api.phyziq.com/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: pendingLogs })
    });

    if (response.ok) {
      // Mark as synced locally
      for (const log of pendingLogs as any[]) {
        await db.runAsync(`UPDATE local_workout_logs SET sync_status = 'synced' WHERE id = ?`, [log.id]);
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
