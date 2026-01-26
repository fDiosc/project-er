-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ER" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalId" TEXT,
    "subject" TEXT NOT NULL,
    "overview" TEXT,
    "description" TEXT,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priorityLabel" TEXT,
    "submittedPriority" TEXT,
    "sentiment" TEXT,
    "committedVersion" TEXT,
    "requestedAt" DATETIME,
    "updatedAtCsv" DATETIME,
    "strategic" INTEGER,
    "impact" INTEGER,
    "technical" INTEGER,
    "resource" INTEGER,
    "market" INTEGER,
    "totalCached" INTEGER,
    "externalStatus" TEXT,
    "externalStatusAlt" TEXT,
    "externalRequestStatus" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CSV',
    "lastSyncAt" DATETIME,
    "zendeskTicketUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ER_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ER" ("committedVersion", "companyId", "createdAt", "description", "externalId", "externalRequestStatus", "externalStatus", "externalStatusAlt", "id", "impact", "market", "overview", "priorityLabel", "requestedAt", "resource", "sentiment", "status", "strategic", "subject", "submittedPriority", "technical", "totalCached", "updatedAt", "updatedAtCsv") SELECT "committedVersion", "companyId", "createdAt", "description", "externalId", "externalRequestStatus", "externalStatus", "externalStatusAlt", "id", "impact", "market", "overview", "priorityLabel", "requestedAt", "resource", "sentiment", "status", "strategic", "subject", "submittedPriority", "technical", "totalCached", "updatedAt", "updatedAtCsv" FROM "ER";
DROP TABLE "ER";
ALTER TABLE "new_ER" RENAME TO "ER";
CREATE INDEX "ER_companyId_idx" ON "ER"("companyId");
CREATE INDEX "ER_status_idx" ON "ER"("status");
CREATE INDEX "ER_subject_idx" ON "ER"("subject");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
