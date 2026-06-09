/*
  Warnings:

  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `taskId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Task_templateId_idx";

-- DropIndex
DROP INDEX "Task_dueDate_idx";

-- DropIndex
DROP INDEX "Task_createdById_idx";

-- DropIndex
DROP INDEX "Task_assignedToId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Task";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Chore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "householdId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rewardCents" INTEGER,
    "unitRewardCents" INTEGER,
    "assigneeId" TEXT,
    "recurrence" TEXT,
    "weeklyDays" TEXT,
    "startDay" TEXT,
    "missedPolicy" TEXT NOT NULL DEFAULT 'CURRENT_ONLY',
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chore_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chore_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChoreCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choreId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "occurrenceKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "quantity" INTEGER,
    "rewardCents" INTEGER,
    "completedAt" DATETIME,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChoreCompletion_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "Chore" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChoreCompletion_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "completionId" TEXT,
    "goalId" TEXT,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_completionId_fkey" FOREIGN KEY ("completionId") REFERENCES "ChoreCompletion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingsGoal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "goalId", "id", "note", "type", "userId") SELECT "amount", "createdAt", "goalId", "id", "note", "type", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_completionId_key" ON "Transaction"("completionId");
CREATE UNIQUE INDEX "Transaction_goalId_key" ON "Transaction"("goalId");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Chore_householdId_idx" ON "Chore"("householdId");

-- CreateIndex
CREATE INDEX "Chore_assigneeId_idx" ON "Chore"("assigneeId");

-- CreateIndex
CREATE INDEX "ChoreCompletion_childId_idx" ON "ChoreCompletion"("childId");

-- CreateIndex
CREATE INDEX "ChoreCompletion_choreId_idx" ON "ChoreCompletion"("choreId");

-- CreateIndex
CREATE UNIQUE INDEX "ChoreCompletion_choreId_occurrenceKey_key" ON "ChoreCompletion"("choreId", "occurrenceKey");
