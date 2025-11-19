const express = require('express');
const { DonationStockService } = require('../services/DonationStockService');
const router = express.Router();

// Busca produtos similares por nome/categoria
router.post('/similares', async (req, res) => {
  try {
    const { nome = '', categoria = '' } = req.body || {};
    const similares = await DonationStockService.findSimilarProducts({ nome, categoria });
    return res.json({ success: true, data: similares });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Processa uma doação de item (API independente)
router.post('/processar-item', async (req, res) => {
  try {
    const {
      produto_id: produtoId = null,
      nome,
      categoria,
      unidade_medida = 'Unidade',
      quantidade,
      doacao_id: doacaoId,
      metadata = {},
    } = req.body || {};

    const result = await DonationStockService.processDonationItem({
      produtoId,
      nome,
      categoria,
      unidade_medida,
      quantidade,
      doacaoId,
      metadata,
    });

    if (!result.success) {
      const status = result.code === 'ERRO_QUANTIDADE_INVALIDA' ? 400 : 500;
      return res.status(status).json({ success: false, code: result.code, message: result.error });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
/*
  Rotas de Estoque de Doações
  - Endpoints para consulta e ajustes de estoque relacionado a doações.
  - Prefixo: `/api/estoque/doacoes`.
*/