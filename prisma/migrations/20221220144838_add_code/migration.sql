/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Signatures` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Signatures` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Signatures" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Signatures_code_key" ON "Signatures"("code");
