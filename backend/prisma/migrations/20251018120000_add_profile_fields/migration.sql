-- Add support for profile avatars and Google linkage metadata
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "users" ADD COLUMN "googlePictureUrl" TEXT;
ALTER TABLE "users" ADD COLUMN "googleConnected" INTEGER NOT NULL DEFAULT 0;
