const express = require("express");
const authController = require("../controllers/authController");
const categoryController = require("../controllers/categoryController");
const router = new express.Router();

router.post(
  "/createCategory",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  categoryController.addCategory
);
router.put(
  "/updateCategory/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  categoryController.updateCategory
);
router.delete(
  "/deleteCategory/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  categoryController.deleteCategory
);
router.get(
  "/allCategories",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  categoryController.getCategories
);
router.get(
  "/singleCategory/:id",
  authController.protect,
  authController.restrictTo(
    "administrator",
    "Warehouse Manager",
    "Stock Keeper"
  ),
  categoryController.getCategory
);
router.get(
  "/categoryByName/:category",
  // authController.protect,
  // authController.restrictTo("administrator"),
  categoryController.getCategoryByName
);

module.exports = router;
