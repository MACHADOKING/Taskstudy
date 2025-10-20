-- AlterTable
ALTER TABLE "users" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'LOCAL';
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
