import Dexie, { Table } from 'dexie';

export interface LocalCurriculumTopic {
  id: string;
  gradeLevel: number;
  code: string;
  titleShona: string;
  titleEnglish: string;
  category: string;
  description: string;
  iconSvgName: string;
  cachedAt: number;
}

export interface LocalLesson {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  description: string;
  contentJson: any;
  exercises: any[];
  isDownloaded: boolean;
}

export interface LocalExerciseAttempt {
  id?: number; // Auto-incrementing local ID
  childId: string;
  exerciseId: string;
  isCorrect: boolean;
  chosenAnswer: string;
  hintsUsedCount: number;
  timeSpentSeconds: number;
  offlineTimestamp: string;
  isSynced: number; // 0 = unsynced, 1 = synced
  clientBatchId?: string;
}

export interface LocalChildState {
  childId: string;
  displayName: string;
  gradeLevel: number;
  avatarId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalXp: number;
  lastSyncedAt: number;
}

export interface LocalMasteryCache {
  id?: number;
  childId: string;
  competencyCode: string;
  masteryScore: number;
  totalAttempts: number;
  correctAttempts: number;
}

export class TinayeOfflineDatabase extends Dexie {
  topics!: Table<LocalCurriculumTopic, string>;
  lessons!: Table<LocalLesson, string>;
  attempts!: Table<LocalExerciseAttempt, number>;
  childState!: Table<LocalChildState, string>;
  masteryCache!: Table<LocalMasteryCache, number>;

  constructor() {
    super('TinayeOfflineDB');
    this.version(1).stores({
      topics: 'id, gradeLevel, code, category',
      lessons: 'id, topicId, slug, isDownloaded',
      attempts: '++id, childId, exerciseId, isSynced, offlineTimestamp',
      childState: 'childId',
      masteryCache: '++id, [childId+competencyCode], childId',
    });
  }
}

// Client-side singleton
export const offlineDb = typeof window !== 'undefined' ? new TinayeOfflineDatabase() : null!;
