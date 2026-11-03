/*
  Warnings:

  - You are about to drop the column `youtubeUrl` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the `Video` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_recipeId_fkey";

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "youtubeUrl";

-- DropTable
DROP TABLE "Video";
