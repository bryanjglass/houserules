-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "householdCode" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "pinHash" TEXT,
    "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" DATETIME,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CHILD',
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "householdCode", "id", "name", "parentId", "passwordHash", "pinFailedAttempts", "pinHash", "pinLockedUntil", "role") SELECT "createdAt", "email", "householdCode", "id", "name", "parentId", "passwordHash", "pinFailedAttempts", "pinHash", "pinLockedUntil", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_householdCode_key" ON "User"("householdCode");
CREATE INDEX "User_parentId_idx" ON "User"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
