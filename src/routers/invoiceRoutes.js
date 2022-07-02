const express = require("express");
const authController = require("../controllers/authController");
const invoiceController = require("../controllers/invoiceController");
const router = new express.Router();

router.post(
  "/createInvoice",
  authController.protect,
  authController.restrictTo("administrator"),
  invoiceController.addInvoice
);
router.put(
  "/updateInvoice/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  invoiceController.updateInvoice
);
router.delete(
  "/deleteInvoice/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  invoiceController.deleteInvoice
);
router.get(
  "/allInvoices",
  authController.protect,
  authController.restrictTo("administrator"),
  invoiceController.getInvoices
);
router.get(
  "/singleInvoice/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  invoiceController.getInvoice
);

module.exports = router;
