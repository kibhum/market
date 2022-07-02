const express = require("express");
const createDbTablesController = require("../controllers/createDbTablesController");
const router = new express.Router();

router.get("/createDbTables", createDbTablesController.createTables);

module.exports = router;
