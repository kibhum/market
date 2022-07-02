const express = require("express");
const authController = require("../controllers/authController");
const countryController = require("../controllers/countryController");
const router = new express.Router();

router.post(
  "/createCountry",
  authController.protect,
  authController.restrictTo("administrator"),
  countryController.addCountry
);
router.put(
  "/updateCountry/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  countryController.updateCountry
);
router.delete(
  "/deleteCountry/:id",
  authController.protect,
  authController.restrictTo("administrator"),
  countryController.deleteCountry
);
router.get(
  "/allCountries",
  // authController.protect,
  // authController.restrictTo("administrator"),
  countryController.getCountries
);
router.get(
  "/singleCountry/:id",
  // authController.protect,
  // authController.restrictTo("administrator"),
  countryController.getCountry
);
router.get(
  "/countryByName/:country",
  // authController.protect,
  // authController.restrictTo("administrator"),
  countryController.getCountryByName
);

module.exports = router;
