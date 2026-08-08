-- DropIndex
DROP INDEX "Task_seedKey_key";

-- DropIndex
DROP INDEX "Routine_seedKey_key";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "seedKey";

-- AlterTable
ALTER TABLE "Routine" DROP COLUMN "seedKey";