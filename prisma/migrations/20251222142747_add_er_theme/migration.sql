-- CreateTable
CREATE TABLE "ERTheme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "externalUpdatedAt" DATETIME,
    "zendeskTicketUrl" TEXT,
    "aiSummary" TEXT,
    "aiSuggestedScores" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "themeId" TEXT,
    CONSTRAINT "ER_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ER_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "ERTheme" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ER" ("aiSuggestedScores", "aiSummary", "committedVersion", "companyId", "createdAt", "description", "externalId", "externalRequestStatus", "externalStatus", "externalStatusAlt", "externalUpdatedAt", "id", "impact", "lastSyncAt", "market", "overview", "priorityLabel", "requestedAt", "resource", "sentiment", "source", "status", "strategic", "subject", "submittedPriority", "technical", "totalCached", "updatedAt", "updatedAtCsv", "zendeskTicketUrl") SELECT "aiSuggestedScores", "aiSummary", "committedVersion", "companyId", "createdAt", "description", "externalId", "externalRequestStatus", "externalStatus", "externalStatusAlt", "externalUpdatedAt", "id", "impact", "lastSyncAt", "market", "overview", "priorityLabel", "requestedAt", "resource", "sentiment", "source", "status", "strategic", "subject", "submittedPriority", "technical", "totalCached", "updatedAt", "updatedAtCsv", "zendeskTicketUrl" FROM "ER";
DROP TABLE "ER";
ALTER TABLE "new_ER" RENAME TO "ER";
CREATE INDEX "ER_companyId_idx" ON "ER"("companyId");
CREATE INDEX "ER_status_idx" ON "ER"("status");
CREATE INDEX "ER_subject_idx" ON "ER"("subject");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
