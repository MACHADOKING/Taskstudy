/*
  Warnings:

  - You are about to alter the column `googleConnected` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'LOCAL',
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "googlePictureUrl" TEXT,
    "googleConnected" BOOLEAN NOT NULL DEFAULT false,
    "notificationEmail" TEXT DEFAULT '',
    "phone" TEXT DEFAULT '',
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyByTelegram" BOOLEAN NOT NULL DEFAULT false,
    "notifyByWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatarUrl", "consentGiven", "createdAt", "email", "googleConnected", "googleId", "googlePictureUrl", "id", "name", "notificationEmail", "notifyByEmail", "notifyByTelegram", "notifyByWhatsApp", "password", "phone", "provider", "updatedAt") SELECT "avatarUrl", "consentGiven", "createdAt", "email", "googleConnected", "googleId", "googlePictureUrl", "id", "name", "notificationEmail", "notifyByEmail", "notifyByTelegram", "notifyByWhatsApp", "password", "phone", "provider", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
