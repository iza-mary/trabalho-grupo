const express = require('express');
const router = express.Router();
const { batchUpdate } = require('../services/NameUpdateService');

// POST /api/nomes/batch-update
router.post('/batch-update', async (req, res) => {
  try {
    const { tipo, updates, chunkSize, concurrency } = req.body || {};
    if (!tipo || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Corpo inválido: { tipo, updates[] } obrigatório' });
    }
    const result = await batchUpdate({ tipo, updates, chunkSize, concurrency });
    res.json({ message: 'Batch de atualização concluído', result });
  } catch (error) {
    res.status(500).json({ message: 'Erro no batch de atualização', error: error.message });
  }
});

module.exports = router;