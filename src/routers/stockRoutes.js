const express = require("express");
const authController = require("../controllers/authController");
const stockController = require("../controllers/stockController");
const categoryController = require("../controllers/categoryController");
const warehouseController = require("../controllers/warehouseController");
const itemController = require("../controllers/itemController");
const batchController = require("../controllers/batchController");
const supplierController = require("../controllers/supplierController");
const router = new express.Router();

router.post(
  "/createStock",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),

  stockController.addStock,
  itemController.addItemAuto
);
router.put(
  "/updateStock/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  stockController.updateStock
);
router.delete(
  "/deleteStock/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  stockController.deleteStock
);
router.get("/allStocks", stockController.getStocks);
router.get(
  "/singleStock/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),

  stockController.getStock
);
// router.get(
//   "/stockExpiryDate/:date",
//   authController.protect,
//   authController.restrictTo("administrator"),
//   stockController.stocksByExpiryDate
// );
router.get(
  "/stockCreatedDate/:date",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),

  stockController.stocksByCreatedDate
);
router.get(
  "/stockCategory/:category",
  categoryController.getCategoryByName,
  stockController.stocksByCategory
);

module.exports = router;
