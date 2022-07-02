const express = require("express");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const profileController = require("../controllers/profileController");
// const User = require("../models/user");
const router = new express.Router();
// Users
router.post(
  "/signup",
  authController.protect,
  authController.restrictTo("administrator"),
  profileController.getProfileByName,
  authController.signup
);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get(
  "/currentUser",
  authController.protect,
  authController.currentUserProfile
);

// All Users
router.get(
  "/allUsers",
  authController.protect,
  authController.restrictTo("administrator"),
  userController.allUsers
);
// Single User
router.get(
  "/singleUser/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  userController.singleUser
);
// Delete User
router.delete(
  "/deleteUser/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  userController.deleteUser
);
// Update
router.put(
  "/updateUser/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  profileController.getProfileByName,
  userController.updateUser
);

router.post("/forgotPassword", authController.forgotPassword);

router.get("/users", authController.protect, userController.allUsers);

router.delete(
  "/users/:id",
  authController.protect,
  authController.restrictTo("admininstrator"),
  userController.deleteUser
);
router.get(
  "/userPassword/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  authController.userPassword
);
router.post(
  "/usedPasswords",
  // authController.protect,
  // authController.restrictTo("administrator"),
  authController.passwordsUsed
);
router.post(
  "/isPasswordUsed",
  // authController.protect,
  // authController.restrictTo("administrator"),
  authController.checkPasswordsUsed
);
router.get(
  "/getUsedPasswords/:userId",
  // authController.protect,
  // authController.restrictTo("administrator"),
  authController.getPasswordsUsed
);
router.patch(
  "/updatePassword/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  authController.updatePassword
);
router.patch(
  "/resetPassword/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  authController.updatePasswordAdmin
);

module.exports = router;
