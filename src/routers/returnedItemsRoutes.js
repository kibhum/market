const express = require("express");
const authController = require("../controllers/authController");
const warehouseController = require("../controllers/warehouseController");
const saleController = require("../controllers/saleController");
const returnedItemsController = require("../controllers/returnedItemsController");
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
  warehouseController.getWarehouseByName,
  itemController.soldItemByBarcode,
  saleController.saleByBarcode,
  returnedItemsController.addItem
);
router.put(
  "/updateItem/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  warehouseController.getWarehouseByName,
  saleController.saleByBarcode,
  returnedItemsController.updateItem
);
router.delete(
  "/deleteItem/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  returnedItemsController.deleteItem
);
router.get("/allItems", returnedItemsController.getItems);
router.get(
  "/singleItem/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  returnedItemsController.getItem
);
router.patch(
  "/modifyItem/:barcode",
  authController.protect,
  authController.restrictTo("administrator"),
  returnedItemsController.modifyItem
);

router.get(
  "/itemReturnedDate/:date",
  // authController.protect,
  // authController.restrictTo("administrator"),
  returnedItemsController.ItemsReturnedDate
);
// router.get(
//   "/itemCategory/:category",

//   returnedItemsController.ItemsByCategory
// );

module.exports = router;
