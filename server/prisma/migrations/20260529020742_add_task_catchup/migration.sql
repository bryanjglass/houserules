-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dollarAmount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isUpForGrabs" BOOLEAN NOT NULL DEFAULT false,
    "isPerUnit" BOOLEAN NOT NULL DEFAULT false,
    "unitReward" INTEGER,
    "quantity" INTEGER,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "approvedAt" DATETIME,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "weeklyDays" TEXT,
    "catchUp" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("approvedAt", "assignedToId", "completedAt", "createdAt", "createdById", "description", "dollarAmount", "dueDate", "id", "isPerUnit", "isRecurring", "isUpForGrabs", "quantity", "recurrence", "status", "templateId", "title", "unitReward", "weeklyDays") SELECT "approvedAt", "assignedToId", "completedAt", "createdAt", "createdById", "description", "dollarAmount", "dueDate", "id", "isPerUnit", "isRecurring", "isUpForGrabs", "quantity", "recurrence", "status", "templateId", "title", "unitReward", "weeklyDays" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_templateId_idx" ON "Task"("templateId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
