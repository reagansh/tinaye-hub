-- =========================================================================
-- TINAYE-HUB: PostgreSQL Database Initialization Script
-- Production-Ready for Supabase, Render, Neon, or Managed PostgreSQL
-- =========================================================================

-- Enable pgcrypto / uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Custom ENUM Types
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('PARENT', 'CHILD', 'TEACHER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'MICRO_1USD', 'DONATION_SUPPORTER', 'SCHOLARSHIP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'TRIALING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompetencyCategory" AS ENUM (
    'PHONICS_MABHII',
    'VOCABULARY_MAZWI',
    'NOUN_CLASSES_MIPANDA',
    'VERBS_ZVIITO',
    'IDEOPHONES_NYAUDZOSINGWI',
    'PROVERBS_TSUMO',
    'IDIOMS_MADIMIKIRA',
    'COMPREHENSION_NHAURWA',
    'CULTURE_TSIKA'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MasteryStatus" AS ENUM ('NOT_STARTED', 'FAMILIAR', 'PROFICIENT', 'MASTERED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExerciseType" AS ENUM ('MULTIPLE_CHOICE', 'DRAG_MATCH', 'FILL_BLANK', 'SENTENCE_ORDER', 'DIALOGUE_BRANCH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DigestFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmailDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table: Users (Parents / Guardians)
CREATE TABLE IF NOT EXISTS "User" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "role" "Role" DEFAULT 'PARENT' NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  "phone" VARCHAR(50),
  "preferredLanguage" VARCHAR(10) DEFAULT 'sn' NOT NULL,
  "stripeCustomerId" VARCHAR(255) UNIQUE,
  "subscriptionTier" "SubscriptionTier" DEFAULT 'FREE' NOT NULL,
  "emailDigestOptIn" BOOLEAN DEFAULT TRUE NOT NULL,
  "digestFrequency" "DigestFrequency" DEFAULT 'WEEKLY' NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: Child Profiles
CREATE TABLE IF NOT EXISTS "ChildProfile" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "parentId" VARCHAR(36) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "displayName" VARCHAR(100) NOT NULL,
  "gradeLevel" INTEGER NOT NULL CHECK ("gradeLevel" BETWEEN 1 AND 7),
  "avatarId" VARCHAR(50) DEFAULT 'shumba' NOT NULL,
  "pinHash" VARCHAR(255),
  "currentStreak" INTEGER DEFAULT 0 NOT NULL,
  "longestStreak" INTEGER DEFAULT 0 NOT NULL,
  "lastActiveDate" TIMESTAMP WITH TIME ZONE,
  "totalXp" INTEGER DEFAULT 0 NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: Subscriptions ($1/Month Micro-SaaS)
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" VARCHAR(36) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "stripeSubscriptionId" VARCHAR(255) UNIQUE,
  "stripePriceId" VARCHAR(255),
  "status" "SubscriptionStatus" DEFAULT 'ACTIVE' NOT NULL,
  "tier" "SubscriptionTier" DEFAULT 'MICRO_1USD' NOT NULL,
  "amountCents" INTEGER DEFAULT 100 NOT NULL,
  "currency" VARCHAR(10) DEFAULT 'usd' NOT NULL,
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL,
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT FALSE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: Donations (Pay-What-You-Want Model)
CREATE TABLE IF NOT EXISTS "Donation" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" VARCHAR(36) REFERENCES "User"("id") ON DELETE SET NULL,
  "stripePaymentIntentId" VARCHAR(255) UNIQUE,
  "amountCents" INTEGER NOT NULL,
  "currency" VARCHAR(10) DEFAULT 'usd' NOT NULL,
  "donorName" VARCHAR(150),
  "message" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: Curriculum Topics (ZIMSEC Primary Aligned)
CREATE TABLE IF NOT EXISTS "CurriculumTopic" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "gradeLevel" INTEGER NOT NULL CHECK ("gradeLevel" BETWEEN 1 AND 7),
  "code" VARCHAR(50) UNIQUE NOT NULL,
  "titleShona" VARCHAR(255) NOT NULL,
  "titleEnglish" VARCHAR(255) NOT NULL,
  "category" "CompetencyCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "iconSvgName" VARCHAR(50) DEFAULT 'book-open' NOT NULL
);

-- Table: Lessons
CREATE TABLE IF NOT EXISTS "Lesson" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "topicId" VARCHAR(36) NOT NULL REFERENCES "CurriculumTopic"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) UNIQUE NOT NULL,
  "description" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "contentJson" JSONB NOT NULL
);

-- Table: Competencies
CREATE TABLE IF NOT EXISTS "Competency" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "topicId" VARCHAR(36) NOT NULL REFERENCES "CurriculumTopic"("id") ON DELETE CASCADE,
  "code" VARCHAR(50) UNIQUE NOT NULL,
  "nameShona" VARCHAR(255) NOT NULL,
  "nameEnglish" VARCHAR(255) NOT NULL,
  "category" "CompetencyCategory" NOT NULL
);

-- Table: Exercises
CREATE TABLE IF NOT EXISTS "Exercise" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "lessonId" VARCHAR(36) NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE,
  "type" "ExerciseType" NOT NULL,
  "questionShona" TEXT NOT NULL,
  "instructionsShona" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "socraticHintsJson" JSONB NOT NULL,
  "targetCompetencyCode" VARCHAR(50)
);

-- Table: Mastery Records
CREATE TABLE IF NOT EXISTS "MasteryRecord" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "childId" VARCHAR(36) NOT NULL REFERENCES "ChildProfile"("id") ON DELETE CASCADE,
  "competencyId" VARCHAR(36) NOT NULL REFERENCES "Competency"("id") ON DELETE CASCADE,
  "masteryLevel" "MasteryStatus" DEFAULT 'NOT_STARTED' NOT NULL,
  "masteryScore" REAL DEFAULT 0.0 NOT NULL,
  "totalAttempts" INTEGER DEFAULT 0 NOT NULL,
  "correctAttempts" INTEGER DEFAULT 0 NOT NULL,
  "consecutiveCorrect" INTEGER DEFAULT 0 NOT NULL,
  "needsIntervention" BOOLEAN DEFAULT FALSE NOT NULL,
  "lastPracticedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "uq_child_competency" UNIQUE ("childId", "competencyId")
);

-- Table: Exercise Attempts (Sync from Client)
CREATE TABLE IF NOT EXISTS "ExerciseAttempt" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "childId" VARCHAR(36) NOT NULL REFERENCES "ChildProfile"("id") ON DELETE CASCADE,
  "exerciseId" VARCHAR(36) NOT NULL REFERENCES "Exercise"("id") ON DELETE CASCADE,
  "isCorrect" BOOLEAN NOT NULL,
  "chosenAnswer" TEXT NOT NULL,
  "hintsUsedCount" INTEGER DEFAULT 0 NOT NULL,
  "timeSpentSeconds" INTEGER DEFAULT 0 NOT NULL,
  "offlineTimestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
  "syncedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "clientBatchId" VARCHAR(100),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: Daily Activity
CREATE TABLE IF NOT EXISTS "DailyActivity" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "childId" VARCHAR(36) NOT NULL REFERENCES "ChildProfile"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "xpEarned" INTEGER DEFAULT 0 NOT NULL,
  "exercisesDone" INTEGER DEFAULT 0 NOT NULL,
  "timeSeconds" INTEGER DEFAULT 0 NOT NULL,
  CONSTRAINT "uq_child_activity_date" UNIQUE ("childId", "date")
);

-- Table: Parent Weekly/Monthly Digest Reports
CREATE TABLE IF NOT EXISTS "ParentReportDigest" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "parentId" VARCHAR(36) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "childId" VARCHAR(36) NOT NULL REFERENCES "ChildProfile"("id") ON DELETE CASCADE,
  "weekStartDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "weekEndDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "lessonsCompleted" INTEGER NOT NULL,
  "totalTimeSpentMinutes" INTEGER NOT NULL,
  "streakDays" INTEGER NOT NULL,
  "overallMasteryScore" REAL NOT NULL,
  "strengthsJson" JSONB NOT NULL,
  "areasOfImprovementJson" JSONB NOT NULL,
  "recommendationsShona" TEXT NOT NULL,
  "recommendationsEnglish" TEXT NOT NULL,
  "emailStatus" "EmailDeliveryStatus" DEFAULT 'QUEUED' NOT NULL,
  "emailMessageId" VARCHAR(255),
  "sentAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: Offline Sync Logs (Idempotency)
CREATE TABLE IF NOT EXISTS "OfflineSyncLog" (
  "id" VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "childId" VARCHAR(36) NOT NULL REFERENCES "ChildProfile"("id") ON DELETE CASCADE,
  "deviceId" VARCHAR(100) NOT NULL,
  "batchId" VARCHAR(100) UNIQUE NOT NULL,
  "itemsSynced" INTEGER NOT NULL,
  "clientAppVersion" VARCHAR(50) NOT NULL,
  "syncedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for Speed & Performance
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_stripe_cust" ON "User"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "idx_child_parent" ON "ChildProfile"("parentId");
CREATE INDEX IF NOT EXISTS "idx_child_grade" ON "ChildProfile"("gradeLevel");
CREATE INDEX IF NOT EXISTS "idx_sub_user" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "idx_curriculum_grade_cat" ON "CurriculumTopic"("gradeLevel", "category");
CREATE INDEX IF NOT EXISTS "idx_mastery_child" ON "MasteryRecord"("childId");
CREATE INDEX IF NOT EXISTS "idx_mastery_intervention" ON "MasteryRecord"("needsIntervention");
CREATE INDEX IF NOT EXISTS "idx_attempt_child" ON "ExerciseAttempt"("childId");
CREATE INDEX IF NOT EXISTS "idx_digest_parent" ON "ParentReportDigest"("parentId");
CREATE INDEX IF NOT EXISTS "idx_digest_status" ON "ParentReportDigest"("emailStatus");
