const db = require('../config/database');

(async () => {
  try {
    console.log('Iniciando reconciliação de produtos a partir de doações...');

    // 1) Ajustar categoria para "Alimentos" onde houver doação de tipo A
    const [resCat] = await db.execute(`
      UPDATE produtos p
      JOIN doacaoproduto dp ON dp.produto_id = p.id
      JOIN doacoes d ON d.id = dp.doacao_id
      SET p.categoria = 'Alimentos'
      WHERE d.tipo = 'A' AND p.categoria <> 'Alimentos'
    `);
    console.log(`Categorias ajustadas: ${resCat.affectedRows || 0}`);

    // 2) Ajustar unidade_medida para a última unidade informada nas doações do produto
    const [resUni] = await db.execute(`
      UPDATE produtos p
      JOIN (
        SELECT dpp.produto_id, dpp.unidade_medida
        FROM doacaoproduto dpp
        JOIN (
          SELECT produto_id, MAX(data_atualizacao) AS mx
          FROM doacaoproduto
          GROUP BY produto_id
        ) r ON r.produto_id = dpp.produto_id AND r.mx = dpp.data_atualizacao
      ) u ON u.produto_id = p.id
      SET p.unidade_medida = u.unidade_medida
      WHERE p.categoria = 'Alimentos'
    `);
    console.log(`Unidades de medida ajustadas: ${resUni.affectedRows || 0}`);

    // 3) Reconciliar quantidade do estoque a partir da soma das doações
    const [resQty] = await db.execute(`
      UPDATE produtos p
      JOIN (
        SELECT produto_id, SUM(quantidade) AS total
        FROM doacaoproduto
        GROUP BY produto_id
      ) s ON s.produto_id = p.id
      SET p.quantidade = s.total,
          p.observacao = CONCAT(COALESCE(p.observacao,''), '\n[', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'), '] reconcile: quantidade=', s.total, ' (via doações)')
      WHERE p.categoria = 'Alimentos'
    `);
    console.log(`Estoques reconciliados: ${resQty.affectedRows || 0}`);

    console.log('Reconciliação concluída com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Falha na reconciliação:', err.message);
    process.exit(1);
  }
})();