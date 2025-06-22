/*
  Warnings:

  - You are about to drop the `mobilePasskey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "mobilePasskey" DROP CONSTRAINT "mobilePasskey_userId_fkey";

-- DropTable
DROP TABLE "mobilePasskey";

-- CreateTable
CREATE TABLE "authPasskey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "lastUsed" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "revokedAt" TEXT,
    "revokedReason" TEXT,
    "metadata" TEXT,
    "aaguid" TEXT,

    CONSTRAINT "authPasskey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authPasskey_credentialId_key" ON "authPasskey"("credentialId");

-- AddForeignKey
ALTER TABLE "authPasskey" ADD CONSTRAINT "authPasskey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
