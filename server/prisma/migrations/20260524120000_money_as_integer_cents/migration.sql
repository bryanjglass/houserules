-- RedefineTables: convert money columns from REAL dollars to INTEGER cents.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dollarAmount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isUpForGrabs" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "approvedAt" DATETIME,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "weeklyDays" TEXT,
    "templateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("approvedAt", "assignedToId", "completedAt", "createdAt", "createdById", "description", "dollarAmount", "dueDate", "id", "isRecurring", "isUpForGrabs", "recurrence", "status", "templateId", "title", "weeklyDays")
SELECT "approvedAt", "assignedToId", "completedAt", "createdAt", "createdById", "description", CAST(ROUND("dollarAmount" * 100) AS INTEGER), "dueDate", "id", "isRecurring", "isUpForGrabs", "recurrence", "status", "templateId", "title", "weeklyDays" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";

CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "id", "note", "taskId", "type", "userId")
SELECT CAST(ROUND("amount" * 100) AS INTEGER), "createdAt", "id", "note", "taskId", "type", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_taskId_key" ON "Transaction"("taskId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
