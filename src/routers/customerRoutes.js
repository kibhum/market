const express = require("express");
const authController = require("../controllers/authController");
const customerController = require("../controllers/customerController");
const businessTypeController = require("../controllers/businessTypeController");

const router = new express.Router();

router.post(
  "/createCustomer",
  authController.protect,
  authController.restrictTo("administrator"),
  businessTypeController.getBusinessTypeByName,
  customerController.addCustomer
);
router.put(
  "/updateCustomer/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  businessTypeController.getBusinessTypeByName,
  customerController.updateCustomer
);
router.delete(
  "/deleteCustomer/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  customerController.deleteCustomer
);
router.get(
  "/allCustomers",
  authController.protect,
  authController.restrictTo("administrator"),
  customerController.getCustomers
);
router.get(
  "/singleCustomer/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  customerController.getCustomer
);

module.exports = router;
