const express = require("express");
const DoacaoController = require("../controllers/doacaoController");
const router = express.Router();

router.post('/nome', DoacaoController.getDoadorByName);

module.exports = router;