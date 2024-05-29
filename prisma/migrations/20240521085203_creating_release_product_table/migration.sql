-- CreateTable
CREATE TABLE "ReleaseProduct" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "release_status" BOOLEAN NOT NULL DEFAULT true,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL
);
