-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dollarAmount" REAL,
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
INSERT INTO "new_Task" ("approvedAt", "assignedToId", "completedAt", "createdAt", "createdById", "description", "dollarAmount", "dueDate", "id", "isRecurring", "recurrence", "status", "templateId", "title", "weeklyDays") SELECT "approvedAt", "assignedToId", "completedAt", "createdAt", "createdById", "description", "dollarAmount", "dueDate", "id", "isRecurring", "recurrence", "status", "templateId", "title", "weeklyDays" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
