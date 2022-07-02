const express = require("express");
const authController = require("../controllers/authController");
const categoryController = require("../controllers/categoryController");
const attributeController = require("../controllers/attributeController");
const router = new express.Router();

router.post(
  "/createAttribute",
  authController.protect,
  authController.restrictTo("administrator"),
  attributeController.addAttribute
);
router.put(
  "/updateAttribute/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  attributeController.updateAttribute
);
router.delete(
  "/deleteAttribute/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  attributeController.deleteAttribute
);
router.get(
  "/allAttributes",
  authController.protect,
  authController.restrictTo("administrator"),
  attributeController.getAttributes
);
router.get(
  "/singleAttribute/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  attributeController.getAttribute
);

module.exports = router;
