/*
  Warnings:

  - You are about to drop the column `deviceId` on the `mobilePasskey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[credentialId]` on the table `mobilePasskey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `counter` to the `mobilePasskey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `credentialId` to the `mobilePasskey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicKey` to the `mobilePasskey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "mobilePasskey_deviceId_key";

-- AlterTable
ALTER TABLE "mobilePasskey" DROP COLUMN "deviceId",
ADD COLUMN     "aaguid" TEXT,
ADD COLUMN     "counter" INTEGER NOT NULL,
ADD COLUMN     "credentialId" TEXT NOT NULL,
ADD COLUMN     "publicKey" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "passkeyChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,

    CONSTRAINT "passkeyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mobilePasskey_credentialId_key" ON "mobilePasskey"("credentialId");
