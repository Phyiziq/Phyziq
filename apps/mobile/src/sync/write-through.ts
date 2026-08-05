import { initDb } from './db';
import NetInfo from '@react-native-community/netinfo'; // Assuming installed for network state

/**
 * 27.1 Implement write-through layer
 */
export class WriteThroughLayer {
  static async saveWorkoutLog(planId: string, sessionDate: string, logData: any) {
    const db = await initDb();
    const logId = crypto.randomUUID();
    const state = await NetInfo.fetch();

    // The user's requested conflict resolution strategy will go here for backend sync.
    // For now, mobile blindly saves as pending if offline, or attempts sync if online.
    let status = 'pending';

    if (state.isConnected) {
      try {
        // Attempt to send immediately to backend
        const response = await fetch('https://api.phyziq.com/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: [{ id: logId, planId, sessionDate, logData }] })
        });
        
        if (response.ok) {
          status = 'synced';
        }
      } catch (err) {
        // Network failed despite NetInfo saying connected
        status = 'pending';
      }
    }

    // Write through to local SQLite
    await db.runAsync(
      `INSERT INTO local_workout_logs (id, plan_id, session_date, log_data, sync_status, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, planId, sessionDate, JSON.stringify(logData), status, Date.now()]
    );

    return { id: logId, status };
  }
}
