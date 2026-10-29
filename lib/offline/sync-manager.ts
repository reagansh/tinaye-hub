import { offlineDb, LocalExerciseAttempt, LocalChildState } from './db';

export class OfflineSyncManager {
  private static isSyncing = false;

  /**
   * Records an exercise attempt locally in IndexedDB.
   * Updates child streak and XP optimistically on the client.
   */
  static async recordAttemptLocally(attempt: Omit<LocalExerciseAttempt, 'id' | 'isSynced'>) {
    if (!offlineDb) return;

    // 1. Store attempt with pending sync status
    await offlineDb.attempts.add({
      ...attempt,
      isSynced: 0,
      offlineTimestamp: attempt.offlineTimestamp || new Date().toISOString(),
    });

    // 2. Optimistic local child streak & XP calculation
    const childState = await offlineDb.childState.get(attempt.childId);
    if (childState) {
      const today = new Date().toISOString().split('T')[0];
      const lastActive = childState.lastActiveDate
        ? childState.lastActiveDate.split('T')[0]
        : null;

      let newStreak = childState.currentStreak;
      if (lastActive !== today) {
        // If yesterday was last active date, streak increments, else reset to 1
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        newStreak = lastActive === yesterday ? childState.currentStreak + 1 : 1;
      }

      const xpGained = attempt.isCorrect ? 15 : 5;

      await offlineDb.childState.put({
        ...childState,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, childState.longestStreak),
        lastActiveDate: new Date().toISOString(),
        totalXp: childState.totalXp + xpGained,
      });
    }

    // 3. Attempt immediate sync if browser reports online status
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.triggerCloudSync(attempt.childId).catch(console.error);
    }
  }

  /**
   * Scans IndexedDB for unsynced attempts and dispatches them in an idempotent batch to /api/sync.
   */
  static async triggerCloudSync(childId: string): Promise<{ success: boolean; syncedCount: number }> {
    if (!offlineDb || this.isSyncing) {
      return { success: false, syncedCount: 0 };
    }

    try {
      this.isSyncing = true;
      const unsyncedAttempts = await offlineDb.attempts
        .where('isSynced')
        .equals(0)
        .and((item) => item.childId === childId)
        .toArray();

      if (unsyncedAttempts.length === 0) {
        return { success: true, syncedCount: 0 };
      }

      const batchId = `BATCH-${childId}-${Date.now()}`;
      const payload = {
        childId,
        batchId,
        deviceId: typeof window !== 'undefined' ? localStorage.getItem('tinaye_device_id') || 'browser-client' : 'device',
        attempts: unsyncedAttempts.map((att) => ({
          exerciseId: att.exerciseId,
          isCorrect: att.isCorrect,
          chosenAnswer: att.chosenAnswer,
          hintsUsedCount: att.hintsUsedCount,
          timeSpentSeconds: att.timeSpentSeconds,
          offlineTimestamp: att.offlineTimestamp,
        })),
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Sync API returned HTTP ${res.status}`);
      }

      const data = await res.json();

      // Mark local items as synced
      const idsToMark = unsyncedAttempts.map((item) => item.id!).filter(Boolean);
      await offlineDb.attempts.where('id').anyOf(idsToMark).modify({ isSynced: 1, clientBatchId: batchId });

      // Update sync timestamp in local child state
      const existingChild = await offlineDb.childState.get(childId);
      if (existingChild) {
        await offlineDb.childState.update(childId, {
          lastSyncedAt: Date.now(),
          totalXp: data.totalXp ?? existingChild.totalXp,
          currentStreak: data.currentStreak ?? existingChild.currentStreak,
        });
      }

      return { success: true, syncedCount: idsToMark.length };
    } catch (err) {
      console.warn('[OfflineSyncManager] Sync deferred due to network unavailability:', err);
      return { success: false, syncedCount: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Initializes background listeners for reconnect events.
   */
  static registerNetworkListeners(childId: string) {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[OfflineSyncManager] Network online detected. Initiating background sync...');
      this.triggerCloudSync(childId);
    });
  }
}
