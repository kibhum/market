const express = require("express");
const authController = require("../controllers/authController");
const warehouseController = require("../controllers/warehouseController");
const router = new express.Router();

router.post(
  "/createWarehouse",
  authController.protect,
  authController.restrictTo("administrator"),
  warehouseController.addWarehouse
);
router.put(
  "/updateWarehouse/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  warehouseController.updateWarehouse
);
router.delete(
  "/deleteWarehouse/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  warehouseController.deleteWarehouse
);
router.get(
  "/allWarehouses",
  // authController.protect,
  // authController.restrictTo("administrator"),
  warehouseController.getWarehouses
);
router.get(
  "/singleWarehouse/:id",
  // authController.protect,
  // authController.restrictTo("administrator"),
  warehouseController.getWarehouse
);

module.exports = router;
