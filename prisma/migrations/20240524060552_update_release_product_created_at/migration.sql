-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReleaseProduct" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "release_status" BOOLEAN NOT NULL DEFAULT true,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "start_id" BIGINT NOT NULL,
    "end_id" BIGINT NOT NULL,
    "status_id" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ReleaseProduct" ("end", "end_id", "id", "release_status", "start", "start_id", "status_id") SELECT "end", "end_id", "id", "release_status", "start", "start_id", "status_id" FROM "ReleaseProduct";
DROP TABLE "ReleaseProduct";
ALTER TABLE "new_ReleaseProduct" RENAME TO "ReleaseProduct";
PRAGMA foreign_key_check("ReleaseProduct");
PRAGMA foreign_keys=ON;
