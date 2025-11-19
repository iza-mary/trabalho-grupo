const db = require('../config/database');
const MovimentoEstoqueRepository = require('../repository/movimentoEstoqueRepository');

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSetRatio(a, b) {
  const ta = new Set(normalize(a).split(' '));
  const tb = new Set(normalize(b).split(' '));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) { if (tb.has(t)) inter++; }
  return Math.round((inter / Math.max(ta.size, tb.size)) * 100);
}

const ERROR_CODES = {
  ERRO_QUANTIDADE_INVALIDA: 'ERRO_QUANTIDADE_INVALIDA',
  ERRO_PRODUTO_NAO_ENCONTRADO: 'ERRO_PRODUTO_NAO_ENCONTRADO',
  ERRO_CONEXAO_BANCO: 'ERRO_CONEXAO_BANCO',
  ERRO_CONCORRENCIA: 'ERRO_CONCORRENCIA',
};

const DonationStockService = {
  async findSimilarProducts({ codigo = null, nome = '', categoria = null, limit = 10 }) {
    // Busca por nome/categoria e computa similaridade em JS
    const where = [];
    const params = [];
    if (nome && nome.trim() !== '') {
      where.push('LOWER(nome) LIKE ?');
      params.push(`%${normalize(nome)}%`.replace(/\s/g, '%'));
    }
    if (categoria && categoria.trim() !== '') {
      where.push('categoria = ?');
      params.push(categoria);
    }
    const sql = `SELECT id, nome, categoria, unidade_medida, quantidade, data_atualizacao
                 FROM produtos ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY data_atualizacao DESC, id DESC
                 LIMIT ${Math.max(1, Math.min(limit, 50))}`;
    const [rows] = await db.execute(sql, params);
    const scored = rows.map(p => ({
      ...p,
      score: tokenSetRatio(nome, p.nome)
    }))
      .sort((a, b) => b.score - a.score);
    return scored;
  },

  async processDonationItem({
    produtoId = null,
    nome,
    categoria,
    unidade_medida = 'Unidade',
    quantidade,
    doacaoId,
    metadata = {}, // { responsavel_id, responsavel_nome, motivo, observacao, doacao_codigo }
  }) {
    const conn = await db.getConnection();
    try {
      if (!quantidade || Number(quantidade) <= 0) {
        const err = new Error('Quantidade doada deve ser maior que zero');
        err.code = ERROR_CODES.ERRO_QUANTIDADE_INVALIDA;
        throw err;
      }

      await conn.beginTransaction();

      // Resolver produtoId por nome caso não informado
      if (!produtoId) {
        const [prodRows] = await conn.execute(`SELECT id FROM produtos WHERE nome = ? LIMIT 1`, [nome]);
        if (Array.isArray(prodRows) && prodRows.length > 0) {
          produtoId = prodRows[0].id;
        } else {
          const [prodRes] = await conn.execute(
            `INSERT INTO produtos (nome, categoria, unidade_medida, estoque_atual, estoque_minimo, observacao)
             VALUES (?, ?, ?, 0, 0, NULL)`,
            [nome, categoria, unidade_medida]
          );
          produtoId = prodRes.insertId;
        }
      }

      // Lock registro para evitar corrida
      const [preRows] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ? FOR UPDATE`, [produtoId]);
      if (!Array.isArray(preRows) || preRows.length === 0) {
        const err = new Error('Produto não encontrado');
        err.code = ERROR_CODES.ERRO_PRODUTO_NAO_ENCONTRADO;
        throw err;
      }
      const saldoAnterior = Number(preRows[0].quantidade || 0);

      // Inserir item da doação
      await conn.execute(
        `INSERT INTO doacaoproduto (doacao_id, produto_id, unidade_medida, quantidade, observacao)
         VALUES (?, ?, ?, ?, ?)`,
        [doacaoId, produtoId, unidade_medida, quantidade, null]
      );

      // Harmonizar dados do produto e atualizar quantidade
      const [postRows] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [produtoId]);
      const saldoAposInsert = Number(postRows?.[0]?.quantidade ?? saldoAnterior);
      // Aplica incremento manual se necessário (evita duplicidade com triggers)
      let saldoPosterior = saldoAposInsert;
      if ((saldoPosterior - saldoAnterior) < Number(quantidade)) {
        saldoPosterior = saldoAnterior + Number(quantidade);
        await conn.execute(
          `UPDATE produtos SET categoria = ?, unidade_medida = ?, quantidade = ?, estoque_atual = ?, data_atualizacao = NOW() WHERE id = ?`,
          [categoria, unidade_medida, saldoPosterior, saldoPosterior, produtoId]
        );
      } else {
        // Ainda assim atualiza categoria/unidade e timestamp
        await conn.execute(
          `UPDATE produtos SET categoria = ?, unidade_medida = ?, data_atualizacao = NOW() WHERE id = ?`,
          [categoria, unidade_medida, produtoId]
        );
      }

      // Rastreabilidade: registrar movimento estruturado
      await MovimentoEstoqueRepository.create({
        produto_id: produtoId,
        tipo: 'entrada',
        quantidade: Number(quantidade),
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        doacao_id: doacaoId ?? null,
        responsavel_id: metadata?.responsavel_id ?? null,
        responsavel_nome: metadata?.responsavel_nome ?? null,
        motivo: metadata?.motivo ?? 'Doação de item',
        observacao: metadata?.observacao ?? `Doação #${doacaoId || ''}`,
      });

      await conn.commit();
      conn.release();
      return {
        success: true,
        produto_id: produtoId,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
      };
    } catch (err) {
      try { await conn.rollback(); } catch (_) {}
      conn.release();
      err.code = err.code || ERROR_CODES.ERRO_CONEXAO_BANCO;
      return { success: false, error: err.message, code: err.code };
    }
  }
};

module.exports = { DonationStockService, ERROR_CODES };
/*
  Serviço de Estoque de Doações
  - Consolida e deduplica movimentações de estoque provenientes de doações.
  - Garante consistência ao atualizar saldos e registrar históricos.
*/