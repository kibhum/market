const express = require("express");
const authController = require("../controllers/authController");
const itemController = require("../controllers/itemController");
const pdfController = require("../controllers/pdfController");
const router = new express.Router();

router.get(
  "/printAllItems",
  itemController.getItemsPrint,
  pdfController.printAllItems
);

module.exports = router;
