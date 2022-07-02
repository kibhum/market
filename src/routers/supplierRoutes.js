const express = require("express");
const authController = require("../controllers/authController");
const supplierController = require("../controllers/supplierController");
const warehouseController = require("../controllers/warehouseController");
const businessTypeController = require("../controllers/businessTypeController");
const countryController = require("../controllers/countryController");
const router = new express.Router();

router.post(
  "/createSupplier",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  businessTypeController.getBusinessTypeByName,
  supplierController.addSupplier
);
router.put(
  "/updateSupplier/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  businessTypeController.getBusinessTypeByName,
  supplierController.updateSupplier
);
router.delete(
  "/deleteSupplier/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  supplierController.deleteSupplier
);
router.get(
  "/allSuppliers",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  supplierController.getSuppliers
);
router.get(
  "/singleSupplier/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  supplierController.getSupplier
);

module.exports = router;
