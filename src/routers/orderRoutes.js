const express = require("express");
const authController = require("../controllers/authController");
const orderController = require("../controllers/orderController");
const itemController = require("../controllers/itemController");
const supplierController = require("../controllers/supplierController");
const router = new express.Router();

router.post(
  "/createOrder",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  supplierController.getSupplierByName,
  orderController.addOrder
);
router.put(
  "/updateOrder/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  supplierController.getSupplierByName,
  orderController.updateOrder
);
router.delete(
  "/deleteOrder/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  orderController.deleteOrder
);
router.get(
  "/allOrders",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  orderController.getOrders
);

router.patch(
  "/modifyOrder/:purchaseOrderNumber",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  orderController.modifyOrder
);
router.get(
  "/singleOrder/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  orderController.getOrder
);
router.get(
  "/ordersByPurchaseOrderNumber/:purchaseOrderNumber",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  orderController.getOrdersByPurchaseOrderNumber
);

router.get(
  "/orderCreatedDate/:date",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  orderController.ordersByCreatedDate
);

module.exports = router;
