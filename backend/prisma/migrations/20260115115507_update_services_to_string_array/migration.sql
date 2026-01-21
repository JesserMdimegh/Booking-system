/*
  Warnings:

  - You are about to drop the `services` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_providerId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "services" TEXT[];

-- DropTable
DROP TABLE "services";
