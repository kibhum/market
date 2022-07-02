const express = require("express");
const authController = require("../controllers/authController");
const categoryController = require("../controllers/categoryController");
const warehouseController = require("../controllers/warehouseController");
const stockController = require("../controllers/stockController");
const supplierController = require("../controllers/supplierController");
const itemController = require("../controllers/itemController");
const router = new express.Router();

router.post(
  "/createItem",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  // categoryController.getCategoryByName,
  // warehouseController.getWarehouseByName,
  // supplierController.getSupplierByName,
  itemController.addItemManual
);
router.put(
  "/updateItem/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  // categoryController.getCategoryByName,
  warehouseController.getWarehouseByName,
  itemController.updateItem
);
router.delete(
  "/deleteItem/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  itemController.deleteItem
);
router.get("/allItems", itemController.getItems);
router.get("/singleItem/:id", itemController.getItem);
router.get(
  "/itemExpiryDate/:date",
  // authController.protect,
  // authController.restrictTo("administrator"),
  itemController.ItemsExpiryDate
);
router.get(
  "/itemCreatedDate/:date",
  // authController.protect,
  // authController.restrictTo("administrator"),
  itemController.ItemsCreatedDate
);
router.get("/itemCategory/:category", itemController.ItemsByCategory);
router.get("/itemBarcode/:barcode", itemController.ItemByBarcode);
router.get("/scanBarcode/:barcode", itemController.scanItemBarcode);
router.get("/itemBatch/:batchName", itemController.ItemByBatchName);
router.get("/nobarcode", itemController.getItemsWithNoBarcodes);
router.get(
  "/soldItems",
  authController.protect,
  authController.restrictTo("administrator"),
  itemController.soldItems
);

module.exports = router;
