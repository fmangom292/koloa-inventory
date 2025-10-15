-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "inventoryItemId" INTEGER NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "priceAtTime" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "receivedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "inventoryItemId", "orderId", "priceAtTime", "quantityOrdered") SELECT "id", "inventoryItemId", "orderId", "priceAtTime", "quantityOrdered" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE UNIQUE INDEX "OrderItem_orderId_inventoryItemId_key" ON "OrderItem"("orderId", "inventoryItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
