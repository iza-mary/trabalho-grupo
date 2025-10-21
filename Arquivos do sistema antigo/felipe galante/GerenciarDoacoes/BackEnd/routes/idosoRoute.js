const express = require("express");
const IdosoController = require("../controllers/idosoController");
const router = express.Router();

router.get("/", IdosoController.getAll);

module.exports = router;