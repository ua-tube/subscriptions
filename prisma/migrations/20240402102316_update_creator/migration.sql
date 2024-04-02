/*
  Warnings:

  - You are about to drop the column `description` on the `creators` table. All the data in the column will be lost.
  - Added the required column `nickname` to the `creators` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "creators" DROP COLUMN "description",
ADD COLUMN     "nickname" TEXT NOT NULL;
