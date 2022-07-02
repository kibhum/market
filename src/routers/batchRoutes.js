const express = require("express");
const authController = require("../controllers/authController");
const batchController = require("../controllers/batchController");
const categoryController = require("../controllers/categoryController");
const warehouseController = require("../controllers/warehouseController");
const itemController = require("../controllers/itemController");
const supplierController = require("../controllers/supplierController");
const router = new express.Router();

router.post(
  "/createBatch",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  supplierController.getSupplierByName,
  categoryController.getCategoryByName,
  warehouseController.getWarehouseByName,
  batchController.addBatchManual
);
router.put(
  "/updateBatch/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  supplierController.getSupplierByName,
  categoryController.getCategoryByName,
  warehouseController.getWarehouseByName,
  batchController.updateBatch
);
router.patch(
  "/modifyBatch/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  supplierController.getSupplierByName,
  categoryController.getCategoryByName,
  warehouseController.getWarehouseByName,
  batchController.updateBatchManual
);
router.delete(
  "/deleteBatch/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  batchController.deleteBatch
);
router.get("/allBatches", batchController.getBatches);
router.get(
  "/singleBatch/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),

  batchController.getBatch
);

module.exports = router;
