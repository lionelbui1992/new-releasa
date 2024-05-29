/*
  Warnings:

  - Added the required column `end_id` to the `ReleaseProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_id` to the `ReleaseProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_id` to the `ReleaseProduct` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReleaseProduct" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "release_status" BOOLEAN NOT NULL DEFAULT true,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "start_id" BIGINT NOT NULL,
    "end_id" BIGINT NOT NULL,
    "status_id" BIGINT NOT NULL
);
INSERT INTO "new_ReleaseProduct" ("end", "id", "release_status", "start") SELECT "end", "id", "release_status", "start" FROM "ReleaseProduct";
DROP TABLE "ReleaseProduct";
ALTER TABLE "new_ReleaseProduct" RENAME TO "ReleaseProduct";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
