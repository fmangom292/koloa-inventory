-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApiLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "userName" TEXT,
    "userCode" TEXT,
    "userRole" TEXT,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestBody" TEXT,
    "responseTime" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ApiLog" ("endpoint", "errorMessage", "id", "ipAddress", "method", "requestBody", "responseTime", "statusCode", "timestamp", "userAgent", "userId") SELECT "endpoint", "errorMessage", "id", "ipAddress", "method", "requestBody", "responseTime", "statusCode", "timestamp", "userAgent", "userId" FROM "ApiLog";
DROP TABLE "ApiLog";
ALTER TABLE "new_ApiLog" RENAME TO "ApiLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
