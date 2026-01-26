-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ER" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ER_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ERTag" (
    "erId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("erId", "tagId"),
    CONSTRAINT "ERTag_erId_fkey" FOREIGN KEY ("erId") REFERENCES "ER" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ERTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "erId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_erId_fkey" FOREIGN KEY ("erId") REFERENCES "ER" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "jsonValue" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "erId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Audit_erId_fkey" FOREIGN KEY ("erId") REFERENCES "ER" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "ER_companyId_idx" ON "ER"("companyId");

-- CreateIndex
CREATE INDEX "ER_status_idx" ON "ER"("status");

-- CreateIndex
CREATE INDEX "ER_subject_idx" ON "ER"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_label_key" ON "Tag"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
