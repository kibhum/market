const express = require("express");
const authController = require("../controllers/authController");
const saleController = require("../controllers/saleController");
const itemController = require("../controllers/itemController");
const categoryController = require("../controllers/categoryController");
const operationController = require("../controllers/operationController");
const warehouseController = require("../controllers/warehouseController");

const router = new express.Router();

router.post(
  "/createSale",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  itemController.ItemByBarcode,
  operationController.getOperationByName,
  saleController.addSale
);
router.put(
  "/updateSale/:id",
  authController.protect,
  authController.restrictTo("administrator", "Warehouse Manager"),
  itemController.soldItemByBarcode,
  operationController.getOperationByName,
  saleController.updateSale
);
router.delete(
  "/deleteSale/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  saleController.deleteSale
);
router.get("/allSales", saleController.getSales);
router.get("/pendingSales", saleController.pendingSales);
router.get("/approvedSales", saleController.approvedSales);
router.get(
  "/singleSale/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  saleController.getSale
);
router.get(
  "/SaleExpiryDate/:date",
  authController.protect,
  authController.restrictTo("administrator"),
  saleController.SalesExpiryDate
);
router.get(
  "/SaleCreatedDate/:date",
  authController.protect,
  authController.restrictTo("administrator"),
  saleController.SalesCreatedDate
);
router.get(
  "/saleCategory/:category",
  authController.protect,
  authController.restrictTo("administrator"),
  saleController.SalesByCategory
);
router.get(
  "/saleBarcode/:barcode",
  authController.protect,
  authController.restrictTo("administrator"),
  saleController.saleByBarcode
);
router.patch(
  "/modifySale/:barcode",
  authController.protect,
  authController.restrictTo("administrator"),
  saleController.modifySale
);

module.exports = router;
