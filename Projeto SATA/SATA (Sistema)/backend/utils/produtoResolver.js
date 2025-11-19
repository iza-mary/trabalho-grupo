const audit = require('../utils/auditLogger');

// Normaliza nomes para comparação: trim e lower-case
function normalizeName(nome) {
  if (typeof nome !== 'string') return '';
  return nome.trim().toLowerCase();
}

/**
 * Resolve e aplica a estratégia de produto update-or-create com validações para evitar duplicados.
 * - Prioriza produtoId explícito.
 * - Se nome mudou e não há outro produto com o mesmo nome normalizado, atualiza nome do produto existente.
 * - Se já existe outro produto com o nome alvo, faz relink para esse produto.
 * - Se nenhum produto encontrado por id ou nome, cria um novo.
 * Todas as operações usam a mesma conexão (dentro de transação externa).
 * @param {object} conn - conexão mysql2 de transação
 * @param {object} params
 * @param {number|null} params.produtoId - id explícito do produto
 * @param {string} params.nome - nome solicitado (item)
 * @param {string} [params.categoria]
 * @param {string} [params.unidade]
 * @param {object} [params.actor] - { id, nome }
 * @returns {Promise<{ id:number, action:'keep'|'update'|'relink'|'create', previous?:object, updated?:object }>} id do produto resolvido e ação aplicada
 */
async function resolveProduto(conn, { produtoId, nome, categoria, unidade, actor }) {
  const targetNorm = normalizeName(nome);
  let current = null;

  if (produtoId) {
    const [rows] = await conn.execute(`SELECT id, nome, categoria, unidade_medida FROM produtos WHERE id = ? LIMIT 1`, [produtoId]);
    if (Array.isArray(rows) && rows.length) {
      current = rows[0];
    }
  }

  if (current) {
    const currentNorm = normalizeName(current.nome);
    if (targetNorm && targetNorm !== currentNorm) {
      const [other] = await conn.execute(
        `SELECT id, nome FROM produtos WHERE nome_norm = ? AND id <> ? LIMIT 1`,
        [targetNorm, current.id]
      );
      if (Array.isArray(other) && other.length) {
        const otherId = other[0].id;
        audit.log('produto.relink', {
          from_id: current.id,
          to_id: otherId,
          nome_alvo: nome,
          actor: actor || null,
        });
        return { id: otherId, action: 'relink', previous: current };
      }
      // Atualiza nome e metadados do produto atual
      await conn.execute(
        `UPDATE produtos SET nome = ?, categoria = COALESCE(?, categoria), unidade_medida = COALESCE(?, unidade_medida) WHERE id = ?`,
        [nome, categoria || null, unidade || null, current.id]
      );
      audit.log('produto.update', {
        id: current.id,
        changes: {
          from_nome: current.nome,
          to_nome: nome,
          categoria,
          unidade,
        },
        actor: actor || null,
      });
      return { id: current.id, action: 'update', previous: current, updated: { nome, categoria, unidade } };
    }
    // nome igual: atualiza apenas metadados se fornecidos
    if (categoria || unidade) {
      await conn.execute(
        `UPDATE produtos SET categoria = COALESCE(?, categoria), unidade_medida = COALESCE(?, unidade_medida) WHERE id = ?`,
        [categoria || null, unidade || null, current.id]
      );
      audit.log('produto.update', {
        id: current.id,
        changes: { categoria, unidade },
        actor: actor || null,
      });
    }
    return { id: current.id, action: 'keep', previous: current };
  }

  // Sem produtoId ou id não encontrado: busca por nome normalizado
  if (targetNorm) {
    const [byName] = await conn.execute(
      `SELECT id, nome FROM produtos WHERE nome_norm = ? LIMIT 1`,
      [targetNorm]
    );
    if (Array.isArray(byName) && byName.length) {
      const foundId = byName[0].id;
      audit.log('produto.link_by_name', {
        id: foundId,
        nome_alvo: nome,
        actor: actor || null,
      });
      return { id: foundId, action: 'relink' };
    }
  }

  // Criar novo produto
  const [ins] = await conn.execute(
    `INSERT INTO produtos (nome, categoria, unidade_medida, estoque_atual, estoque_minimo, observacao) VALUES (?, COALESCE(?, 'Outros'), COALESCE(?, 'Unidade'), 0, 0, NULL)`,
    [nome, categoria || null, unidade || null]
  );
  const newId = ins.insertId;
  audit.log('produto.create', {
    id: newId,
    nome,
    categoria: categoria || 'Outros',
    unidade: unidade || 'Unidade',
    actor: actor || null,
  });
  return { id: newId, action: 'create', updated: { nome, categoria, unidade } };
}

/**
 * Upsert rápido de produto baseado em nome normalizado (uk em nome_norm).
 * Usa INSERT ... ON DUPLICATE KEY UPDATE e retorna o id via LAST_INSERT_ID.
 * Atualiza categoria/unidade se fornecidas.
 * @param {object} conn - conexão mysql2 (dentro de transação)
 * @param {object} params
 * @param {string} params.nome
 * @param {string} [params.categoria]
 * @param {string} [params.unidade]
 * @returns {Promise<{ id:number }>}
 */
async function upsertProdutoFast(conn, { nome, categoria, unidade }) {
  // Confia no índice único em nome_norm (coluna gerada) para colisão
  const [res] = await conn.execute(
    `INSERT INTO produtos (nome, categoria, unidade_medida, estoque_atual, estoque_minimo, observacao)
     VALUES (?, COALESCE(?, 'Outros'), COALESCE(?, 'Unidade'), 0, 0, NULL)
     ON DUPLICATE KEY UPDATE
       nome = VALUES(nome),
       categoria = COALESCE(VALUES(categoria), categoria),
       unidade_medida = COALESCE(VALUES(unidade_medida), unidade_medida),
       id = LAST_INSERT_ID(id)`,
    [nome, categoria || null, unidade || null]
  );
  return { id: res.insertId };
}

module.exports = { resolveProduto, normalizeName, upsertProdutoFast };
/*
  Resolver de Produto
  - Funções auxiliares para normalização e validações de produtos.
*/