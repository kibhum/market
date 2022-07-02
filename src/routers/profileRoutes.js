const express = require("express");
const authController = require("../controllers/authController");
const profileController = require("../controllers/profileController");
const router = new express.Router();

router.post(
  "/createProfile",
  authController.protect,
  authController.restrictTo("administrator"),
  profileController.addProfile
);
router.put(
  "/updateProfile/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  profileController.updateProfile
);
router.delete(
  "/deleteProfile/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  profileController.deleteProfile
);
router.get(
  "/allProfiles",
  authController.protect,
  authController.restrictTo("administrator"),
  profileController.getProfiles
);
router.get(
  "/singleProfile/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  profileController.getProfile
);

module.exports = router;
