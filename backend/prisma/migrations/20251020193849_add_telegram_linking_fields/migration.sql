/*
  Warnings:

  - A unique constraint covering the columns `[telegramLinkCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "users" ADD COLUMN "telegramLinkCode" TEXT;
ALTER TABLE "users" ADD COLUMN "telegramLinkCodeGeneratedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramLinkCode_key" ON "users"("telegramLinkCode");
