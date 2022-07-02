const express = require("express");
const authController = require("../controllers/authController");
const businessTypeController = require("../controllers/businessTypeController");
const router = new express.Router();

router.post(
  "/createBusinessType",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  businessTypeController.addBusinessType
);
router.put(
  "/updateBusinessType/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  businessTypeController.updateBusinessType
);
router.delete(
  "/deleteBusinessType/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  businessTypeController.deleteBusinessType
);
router.get(
  "/allBusinessTypes",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  businessTypeController.getBusinessTypes
);
router.get(
  "/singleBusinessType/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),

  businessTypeController.getBusinessType
);

module.exports = router;
