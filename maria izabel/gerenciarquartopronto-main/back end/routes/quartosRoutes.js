const express = require('express');
const router = express.Router();
const quartosController = require('../controllers/quartosController');

router.get('/', quartosController.getAll);
router.post('/', quartosController.create);
router.put('/:id', quartosController.update);
router.delete('/:id', quartosController.delete);

module.exports = router;
