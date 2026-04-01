-- AlterTable
ALTER TABLE "module_progress" ADD COLUMN     "lastVideoPosition" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "videoDuration" INTEGER;
