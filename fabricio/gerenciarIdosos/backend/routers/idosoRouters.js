const express = require('express')
const idosoController = require('../controllers/idosoController');

const router = express.Router();

//Rotas CRUD
router.get('/', idosoController.getAll)
router.get('/:id', idosoController.getById)
router.post('/', idosoController.create)
router.put('/:id', idosoController.update)
router.delete('/:id', idosoController.delete)

module.exports = router