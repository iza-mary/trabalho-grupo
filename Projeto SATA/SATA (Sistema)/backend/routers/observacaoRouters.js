const express = require('express');
const observacaoController = require('../controllers/observacaoController.js');
const router = express.Router({ mergeParams: true });

router.get('/', observacaoController.list);
router.post('/', observacaoController.create);
router.put('/:obsId', observacaoController.update);
router.delete('/:obsId', observacaoController.delete);

module.exports = router;
