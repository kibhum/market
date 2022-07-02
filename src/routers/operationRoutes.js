const express = require("express");
const authController = require("../controllers/authController");
const operationController = require("../controllers/operationController");
const router = new express.Router();

router.post(
  "/createOperation",
  authController.protect,
  authController.restrictTo("administrator"),
  operationController.addOperation
);
router.put(
  "/updateOperation/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  operationController.updateOperation
);
router.delete(
  "/deleteOperation/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  operationController.deleteOperation
);
router.get(
  "/allOperations",
  authController.protect,
  authController.restrictTo("administrator"),
  operationController.getOperations
);
router.get(
  "/singleOperation/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  operationController.getOperation
);

module.exports = router;
