-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DayPart" AS ENUM ('MORNING', 'EVENING', 'NIGHT');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'SOMEDAY');

-- CreateEnum
CREATE TYPE "Repeat" AS ENUM ('DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "dayPart" "DayPart",
    "urgency" "Urgency" NOT NULL DEFAULT 'MEDIUM',
    "date" TEXT,
    "originalDate" TEXT,
    "carryCount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "seedKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "dayPart" "DayPart",
    "urgency" "Urgency" NOT NULL DEFAULT 'MEDIUM',
    "repeat" "Repeat" NOT NULL DEFAULT 'DAILY',
    "weekdays" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "seedKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Completion" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Completion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_seedKey_key" ON "Task"("seedKey");

-- CreateIndex
CREATE INDEX "Task_date_idx" ON "Task"("date");

-- CreateIndex
CREATE INDEX "Task_archivedAt_completedAt_idx" ON "Task"("archivedAt", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Routine_seedKey_key" ON "Routine"("seedKey");

-- CreateIndex
CREATE INDEX "Completion_date_idx" ON "Completion"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Completion_routineId_date_key" ON "Completion"("routineId", "date");

-- AddForeignKey
ALTER TABLE "Completion" ADD CONSTRAINT "Completion_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

