const db = require("../config/database");
const LRUCache = require('../utils/lruCache');
const nameCache = new LRUCache(1000);
const Doacao = require("../models/doacao");
const { computeStockUpdate } = require("../utils/stockUpdateGuard");
const MovimentoEstoqueRepository = require('./movimentoEstoqueRepository');
const { resolveProduto, upsertProdutoFast } = require('../utils/produtoResolver');

let FIN_CACHE = { init: false, hasFinanceiroId: false, hasFinanceiroTable: false };
async function ensureFinanceiroSchema(conn) {
    if (FIN_CACHE.init) return FIN_CACHE;
    try {
        const [colChk] = await conn.query(`
            SELECT COUNT(*) AS cnt
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = 'doacoes_dinheiro'
              AND column_name = 'financeiro_id'
        `);
        const hasFinanceiroId = colChk && colChk[0] && Number(colChk[0].cnt) > 0;
        const [financeiroTable] = await conn.query("SHOW TABLES LIKE 'financeiro'");
        const hasFinanceiroTable = Array.isArray(financeiroTable) && financeiroTable.length > 0;
        FIN_CACHE = { init: true, hasFinanceiroId, hasFinanceiroTable };
        return FIN_CACHE;
    } catch (_) {
        FIN_CACHE = { init: true, hasFinanceiroId: false, hasFinanceiroTable: false };
        return FIN_CACHE;
    }
}

class DoacaoRepository {
    async findAll() {
        try {
            const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, d.evento_id AS eventoId,
            dd.valor AS valor, dd.forma_pagamento AS forma_pagamento, dd.comprovante AS comprovante,
            da.tipo_alimento AS tipo_alimento, da.quantidade AS quantidade_alimento, da.validade AS validade,
            di.descricao_item AS descricao_item, di.quantidade AS quantidade_item, di.estado_conservacao AS estado_conservacao, di.unidade_medida AS unidade_medida,
            dr.id as doadorId, dr.nome as doadorNome,
            e.titulo AS eventoTitulo
            FROM doacoes d
            LEFT JOIN doacoes_dinheiro dd ON dd.doacao_id = d.id
            LEFT JOIN doacoes_alimentos da ON da.doacao_id = d.id
            LEFT JOIN doacoes_itens di ON di.doacao_id = d.id
            LEFT JOIN doadores dr ON d.doador = dr.id
            LEFT JOIN eventos e ON d.evento_id = e.id`;
            const [rows] = await db.execute(sql);
            return rows.map(r => new Doacao({
                ...r,
                valor: r.valor,
                item: r.tipo_alimento || r.descricao_item || null,
                qntd: (r.quantidade_alimento ?? r.quantidade_item) || null,
                unidade_medida: r.unidade_medida || null,
                tipo_alimento: r.tipo_alimento,
                descricao_item: r.descricao_item,
                validade: r.validade,
                estado_conservacao: r.estado_conservacao,
                produto_nome: undefined,
                produto_categoria: undefined,
            }));
        } catch (error) {
            // Fallback para bancos ainda sem coluna idoso_id
            try {
                const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.evento_id AS eventoId,
                dd.valor AS valor, dd.forma_pagamento AS forma_pagamento, dd.comprovante AS comprovante,
                da.tipo_alimento AS tipo_alimento, da.quantidade AS quantidade_alimento, da.validade AS validade,
                di.descricao_item AS descricao_item, di.quantidade AS quantidade_item, di.estado_conservacao AS estado_conservacao, di.unidade_medida AS unidade_medida,
                dr.id as doadorId, dr.nome as doadorNome,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacoes_dinheiro dd ON dd.doacao_id = d.id
                LEFT JOIN doacoes_alimentos da ON da.doacao_id = d.id
                LEFT JOIN doacoes_itens di ON di.doacao_id = d.id
                LEFT JOIN doadores dr ON d.doador = dr.id
                LEFT JOIN eventos e ON d.evento_id = e.id`;
                const [rows] = await db.execute(sql);
                return rows.map(r => new Doacao({
                    ...r,
                    valor: r.valor,
                    item: r.tipo_alimento || r.descricao_item || null,
                    qntd: (r.quantidade_alimento ?? r.quantidade_item) || null,
                    unidade_medida: r.unidade_medida || null,
                    tipo_alimento: r.tipo_alimento,
                    descricao_item: r.descricao_item,
                    validade: r.validade,
                    estado_conservacao: r.estado_conservacao,
                    produto_nome: undefined,
                    produto_categoria: undefined,
                }));
            } catch (fallbackErr) {
                throw new Error(`Erro ao buscar doação: ${fallbackErr.message}`);
            }
        }
    }

    async findById(id) {
        try {
            const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, i.nome as idosoNome, d.evento_id AS eventoId,
            dd.valor AS valor, dd.forma_pagamento AS forma_pagamento, dd.comprovante AS comprovante,
            da.tipo_alimento AS tipo_alimento, da.quantidade AS quantidade_alimento, da.validade AS validade,
            di.descricao_item AS descricao_item, di.quantidade AS quantidade_item, di.estado_conservacao AS estado_conservacao, di.unidade_medida AS unidade_medida,
            dr.id as doadorId, dr.nome as doadorNome,
            e.titulo AS eventoTitulo
            FROM doacoes d 
            LEFT JOIN idosos i ON d.idoso_id = i.id
            LEFT JOIN doacoes_dinheiro dd ON dd.doacao_id = d.id
            LEFT JOIN doacoes_alimentos da ON da.doacao_id = d.id
            LEFT JOIN doacoes_itens di ON di.doacao_id = d.id
            LEFT JOIN doadores dr ON d.doador = dr.id
            LEFT JOIN eventos e ON d.evento_id = e.id
            WHERE d.id = ?`, [id]);
            if (rows.length === 0) return null;
            const r = rows[0];
            return new Doacao({
                ...r,
                valor: r.valor,
                item: r.tipo_alimento || r.descricao_item || null,
                qntd: (r.quantidade_alimento ?? r.quantidade_item) || null,
                unidade_medida: r.unidade_medida || null,
                tipo_alimento: r.tipo_alimento,
                descricao_item: r.descricao_item,
                validade: r.validade,
                estado_conservacao: r.estado_conservacao,
                produto_nome: undefined,
                produto_categoria: undefined,
            })
        } catch (error) {
            // Fallback para bancos ainda sem coluna idoso_id
            try {
                const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.idoso as idosoNome, d.evento_id AS eventoId,
                dd.valor AS valor,
                da.tipo_alimento AS tipo_alimento, da.quantidade AS quantidade_alimento, da.validade AS validade,
                di.descricao_item AS descricao_item, di.quantidade AS quantidade_item, di.estado_conservacao AS estado_conservacao, di.unidade_medida AS unidade_medida,
                dr.id as doadorId, dr.nome as doadorNome,
                e.titulo AS eventoTitulo,
                p.nome AS produto_nome, p.categoria AS produto_categoria
                FROM doacoes d
                LEFT JOIN doacoes_dinheiro dd ON dd.doacao_id = d.id
                LEFT JOIN doacoes_alimentos da ON da.doacao_id = d.id
                LEFT JOIN doacoes_itens di ON di.doacao_id = d.id
                LEFT JOIN doadores dr ON d.doador = dr.id
                LEFT JOIN eventos e ON d.evento_id = e.id
                LEFT JOIN doacaoproduto dp ON dp.doacao_id = d.id
                LEFT JOIN produtos p ON dp.produto_id = p.id
                WHERE d.id = ?`, [id]);
                if (rows.length === 0) return null;
                const r = rows[0];
                return new Doacao({
                    ...r,
                    valor: r.valor,
                    item: r.tipo_alimento || r.descricao_item || null,
                    qntd: (r.quantidade_alimento ?? r.quantidade_item) || null,
                    unidade_medida: r.unidade_medida || null,
                    tipo_alimento: r.tipo_alimento,
                    descricao_item: r.descricao_item,
                    validade: r.validade,
                    estado_conservacao: r.estado_conservacao,
                    produto_nome: r.produto_nome,
                    produto_categoria: r.produto_categoria,
                });
            } catch (fallbackErr) {
                throw new Error(`Erro ao buscar doação: ${fallbackErr.message}`);
            }
        }
    }

    async findByDoadorId(doadorId) {
        try {
            const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, d.evento_id AS eventoId,
            dd.valor AS valor,
            da.tipo_alimento AS tipo_alimento, da.quantidade AS quantidade_alimento, da.validade AS validade,
            di.descricao_item AS descricao_item, di.quantidade AS quantidade_item, di.estado_conservacao AS estado_conservacao,
            dr.id as doadorId, dr.nome as doadorNome,
            e.titulo AS eventoTitulo
            FROM doacoes d
            LEFT JOIN doacoes_dinheiro dd ON dd.doacao_id = d.id
            LEFT JOIN doacoes_alimentos da ON da.doacao_id = d.id
            LEFT JOIN doacoes_itens di ON di.doacao_id = d.id
            LEFT JOIN doadores dr ON d.doador = dr.id
            LEFT JOIN eventos e ON d.evento_id = e.id
            WHERE d.doador = ?`;
            const [rows] = await db.execute(sql, [Number(doadorId)]);
            return rows.map(r => new Doacao({
                ...r,
                valor: r.valor,
                item: r.tipo_alimento || r.descricao_item || null,
                qntd: (r.quantidade_alimento ?? r.quantidade_item) || null,
                unidade_medida: null,
                tipo_alimento: r.tipo_alimento,
                descricao_item: r.descricao_item,
                validade: r.validade,
                estado_conservacao: r.estado_conservacao,
            }));
        } catch (error) {
            // Fallback para bancos sem coluna idoso_id (mantém joins equivalentes)
            try {
                const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.evento_id AS eventoId,
                dd.valor AS valor,
                da.tipo_alimento AS tipo_alimento, da.quantidade AS quantidade_alimento, da.validade AS validade,
                di.descricao_item AS descricao_item, di.quantidade AS quantidade_item, di.estado_conservacao AS estado_conservacao,
                dr.id as doadorId, dr.nome as doadorNome,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacoes_dinheiro dd ON dd.doacao_id = d.id
                LEFT JOIN doacoes_alimentos da ON da.doacao_id = d.id
                LEFT JOIN doacoes_itens di ON di.doacao_id = d.id
                LEFT JOIN doadores dr ON d.doador = dr.id
                LEFT JOIN eventos e ON d.evento_id = e.id
                WHERE d.doador = ?`;
                const [rows] = await db.execute(sql, [Number(doadorId)]);
                return rows.map(r => new Doacao({
                    ...r,
                    valor: r.valor,
                    item: r.tipo_alimento || r.descricao_item || null,
                    qntd: (r.quantidade_alimento ?? r.quantidade_item) || null,
                    unidade_medida: null,
                    tipo_alimento: r.tipo_alimento,
                    descricao_item: r.descricao_item,
                    validade: r.validade,
                    estado_conservacao: r.estado_conservacao,
                }));
            } catch (fallbackErr) {
                throw new Error(`Erro ao buscar doações por doador: ${fallbackErr.message}`);
            }
        }
    }

    async findByFiltred(tipo = "todos", data = "todos", destinatario = "todos", busca = "", eventoId = null) {
        try {
            const where = [];
            const params = [];

            if (tipo !== "todos") {
                where.push("d.tipo = ?");
                params.push(tipo);
            }

            if (data !== "todos") {
                if (data === "hoje") {
                    where.push("DATE(d.data) = CURDATE()");
                } else if (data === "semana") {
                    where.push("YEARWEEK(d.data, 1) = YEARWEEK(CURDATE(), 1)");
                } else if (data === "mes") {
                    where.push("YEAR(d.data) = YEAR(CURDATE()) AND MONTH(d.data) = MONTH(CURDATE())");
                } else if (data === "ano") {
                    where.push("YEAR(d.data) = YEAR(CURDATE())");
                }
            }

            const daSelect = `da.tipo_alimento AS tipo_alimento, da.quantidade AS quantidade_alimento, da.validade AS validade`;
            const diSelect = `di.descricao_item AS descricao_item, di.quantidade AS quantidade_item, di.estado_conservacao AS estado_conservacao, di.unidade_medida AS unidade_medida`;
            const ddSelect = `dd.valor AS valor, dd.forma_pagamento AS forma_pagamento, dd.comprovante AS comprovante`;

            const joinDD = `LEFT JOIN doacoes_dinheiro dd ON dd.doacao_id = d.id`;
            const joinDA = `LEFT JOIN doacoes_alimentos da ON da.doacao_id = d.id`;
            const joinDI = `LEFT JOIN doacoes_itens di ON di.doacao_id = d.id`;

            if (destinatario !== "todos") {
                if (destinatario === "instituicao") {
                    where.push("(d.idoso_id IS NULL OR LOWER(d.idoso) LIKE ? OR LOWER(d.idoso) LIKE ?)");
                    params.push("%instituição%", "%instituicao%");
                } else if (destinatario === "idosos") {
                    where.push("(d.idoso_id IS NOT NULL OR LOWER(d.idoso) LIKE ?)");
                    params.push("%quarto%");
                }
            }

            if (busca && busca.trim() !== "") {
                const raw = busca.toLowerCase();
                const safe = raw.replace(/[\\_%]/g, (m) => `\\${m}`);
                const buscaParam = `%${safe}%`;
                const likeParts = [
                    "LOWER(da.tipo_alimento) COLLATE utf8mb4_general_ci LIKE ?",
                    "LOWER(di.descricao_item) COLLATE utf8mb4_general_ci LIKE ?",
                    "CAST(da.quantidade AS CHAR) LIKE ?",
                    "CAST(di.quantidade AS CHAR) LIKE ?",
                    "CAST(dd.valor AS CHAR) LIKE ?",
                    "LOWER(dd.forma_pagamento) COLLATE utf8mb4_general_ci LIKE ?",
                    "LOWER(dd.comprovante) COLLATE utf8mb4_general_ci LIKE ?",
                    "LOWER(d.idoso) COLLATE utf8mb4_general_ci LIKE ?",
                    "LOWER(e.titulo) COLLATE utf8mb4_general_ci LIKE ?",
                    "LOWER(d.obs) COLLATE utf8mb4_general_ci LIKE ?",
                    "LOWER(dr.nome) COLLATE utf8mb4_general_ci LIKE ?",
                    "LOWER(d.tipo) COLLATE utf8mb4_general_ci LIKE ?",
                    "DATE_FORMAT(d.data, '%d/%m/%Y') LIKE ?",
                    "CAST(d.data AS CHAR) LIKE ?",
                    "DATE_FORMAT(da.validade, '%d/%m/%Y') LIKE ?",
                    "CAST(da.validade AS CHAR) LIKE ?",
                    "LOWER(di.estado_conservacao) COLLATE utf8mb4_general_ci LIKE ?",
                    "LOWER(di.unidade_medida) COLLATE utf8mb4_general_ci LIKE ?"
                ];
                if (likeParts.length) {
                    where.push(`(${likeParts.join(' OR ')})`);
                    for (let i = 0; i < likeParts.length; i++) {
                        params.push(buscaParam);
                    }
                }
            }

            if (eventoId && !isNaN(Number(eventoId))) {
                where.push("(d.evento_id = ?)");
                params.push(Number(eventoId));
            }

            const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, d.evento_id AS eventoId,
            ${ddSelect},
            ${daSelect},
            ${diSelect},
            dr.id as doadorId, dr.nome as doadorNome,
            e.titulo AS eventoTitulo
            FROM doacoes d
            ${joinDD}
            ${joinDA}
            ${joinDI}
            LEFT JOIN doadores dr ON d.doador = dr.id
            LEFT JOIN eventos e ON d.evento_id = e.id ${where.length > 0 ? " WHERE " + where.join(" AND ") : ""}`;
            const [rows] = await db.execute(sql, params);
            return rows.map(r => new Doacao({
                ...r,
                valor: r.valor,
                item: r.tipo_alimento || r.descricao_item || null,
                qntd: (r.quantidade_alimento ?? r.quantidade_item) || null,
                unidade_medida: r.unidade_medida || null,
                tipo_alimento: r.tipo_alimento,
                descricao_item: r.descricao_item,
                validade: r.validade,
                estado_conservacao: r.estado_conservacao,
            }));
        } catch (error) {
            throw new Error("Erro ao filtrar doações: " + error.message)
        }
    }

    async create(doacaoData) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const { data, tipo, obs, evento, eventoId } = doacaoData;
            const { item, qntd, valor } = doacaoData.doacao;
            const {doadorId, nome} = doacaoData.doador
            const idosoId = doacaoData.idoso?.id || doacaoData.idosoId || null;
            const idosoNome = doacaoData.idoso?.nome || doacaoData.idoso || null;
            const tipoNorm = (t) => {
                const v = String(t || '').toUpperCase();
                if (v === 'D' || v === 'DINHEIRO') return 'DINHEIRO';
                if (v === 'A' || v === 'ALIMENTO') return 'ALIMENTO';
                if (v === 'O' || v === 'OUTROS' || v === 'OUTRO') return 'OUTROS';
                return v;
            };
            if (tipoNorm(tipo) === "DINHEIRO") {
                if (!data || String(data).trim().length === 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Data da doação é obrigatória");
                }
                if (!tipo || String(tipo).trim().length === 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Tipo de doação é obrigatório");
                }
                const [result] = await conn.execute(`INSERT INTO doacoes (
                data, tipo, obs, doador, idoso, idoso_id, evento_id) VALUES ( ?, ?, ?, ?, ?, ?, ?)`, [data, tipo, (obs ?? null), doadorId, (idosoNome ?? null), (idosoId ?? null), (eventoId ?? null)]);
                const doacaoId = result.insertId;
                // Integração com financeiro quando coluna financeiro_id existe
                const { hasFinanceiroId: hasFinanceiroIdCol, hasFinanceiroTable } = await ensureFinanceiroSchema(conn);

                if (hasFinanceiroIdCol) {

                    let financeiroId = null;
                    if (hasFinanceiroTable) {
                        const descricao = `Doação em dinheiro - ${nome || doacaoData.doador?.nome || 'Doador ' + doadorId}`;
                        const dataFin = data;
                        const observacaoFin = obs || null;
                        const [finRes] = await conn.execute(
                            `INSERT INTO financeiro (descricao, valor, tipo, categoria, forma_pagamento, recorrente, frequencia_recorrencia, ocorrencias_recorrencia, data, observacao) 
                             VALUES (?, ?, 'Entrada', 'Doações', 'Dinheiro', 0, NULL, NULL, ?, ?)`,
                            [descricao, Number(valor), dataFin, observacaoFin]
                        );
                        financeiroId = finRes.insertId;
                    }

                    const forma = doacaoData?.doacao?.forma_pagamento ?? 'Dinheiro';
                    const comp = doacaoData?.doacao?.comprovante ?? null;
                    const valorNum = Number(valor);
                    if (!valorNum || valorNum <= 0 || Number.isNaN(valorNum)) {
                        await conn.rollback();
                        conn.release();
                        throw new Error("Valor de doação em dinheiro inválido");
                    }
                    await conn.execute(`INSERT INTO doacoes_dinheiro (doacao_id, valor, forma_pagamento, comprovante, financeiro_id) VALUES (?, ?, ?, ?, ?)`, [doacaoId, valorNum, forma, comp, financeiroId]);
                } else {
                    const forma = doacaoData?.doacao?.forma_pagamento ?? 'Dinheiro';
                    const comp = doacaoData?.doacao?.comprovante ?? null;
                    const valorNum = Number(valor);
                    if (!valorNum || valorNum <= 0 || Number.isNaN(valorNum)) {
                        await conn.rollback();
                        conn.release();
                        throw new Error("Valor de doação em dinheiro inválido");
                    }
                    await conn.execute(`INSERT INTO doacoes_dinheiro (doacao_id, valor, forma_pagamento, comprovante) VALUES (?, ?, ?, ?)`, [doacaoId, valorNum, forma, comp]);
                }
                await conn.commit();
                conn.release();
                return await this.findById(doacaoId);
            } else {
                if (!data || String(data).trim().length === 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Data da doação é obrigatória");
                }
                if (!tipo || String(tipo).trim().length === 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Tipo de doação é obrigatório");
                }
                const [result] = await conn.execute(`INSERT INTO doacoes (
                data, tipo, obs, doador, idoso, idoso_id, evento_id) VALUES ( ?, ?, ?, ?, ?, ?, ?)`, [data, tipo, (obs ?? null), doadorId, (idosoNome ?? null), (idosoId ?? null), (eventoId ?? null)]);
                const doacaoId = result.insertId;
                // Validação de quantidade positiva
                const unidadeIns = (doacaoData?.doacao?.unidade_medida ?? 'Unidade(s)');
                const qty = Number(doacaoData?.doacao?.qntd ?? doacaoData?.doacao?.quantidade ?? 0);
                if (!qty || qty <= 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Quantidade doada inválida");
                }
                if (tipoNorm(tipo) === 'ALIMENTO') {
                    const nomeAlimento = (doacaoData?.doacao?.tipo_alimento ?? item ?? '').toString().trim();
                    if (!nomeAlimento) {
                        await conn.rollback();
                        conn.release();
                        throw new Error("Tipo de alimento é obrigatório");
                    }
                    const validade = doacaoData?.doacao?.validade ?? null;
                    await conn.execute(`INSERT INTO doacoes_alimentos (doacao_id, tipo_alimento, quantidade, validade) VALUES (?, ?, ?, ?)`, [doacaoId, nomeAlimento, qty, validade]);
                    const { id: produtoId } = await upsertProdutoFast(conn, { nome: nomeAlimento, categoria: 'Alimentos', unidade: unidadeIns });
                    await conn.execute(`UPDATE produtos SET categoria = ?, unidade_medida = ?, quantidade = quantidade + ? WHERE id = ?`, ['Alimentos', unidadeIns, qty, produtoId]);
                    try {
                      const [afterRows] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [produtoId]);
                      const saldoPosterior = Array.isArray(afterRows) && afterRows.length ? Number(afterRows[0].quantidade) : qty;
                      const saldoAnterior = Math.max(0, saldoPosterior - qty);
                      await MovimentoEstoqueRepository.createWithConn(conn, {
                        produto_id: produtoId,
                        tipo: 'entrada',
                        quantidade: qty,
                        saldo_anterior: saldoAnterior,
                        saldo_posterior: saldoPosterior,
                        doacao_id: doacaoId,
                        responsavel_id: null,
                        responsavel_nome: null,
                        motivo: 'Doação de alimento',
                        observacao: `Doação #${doacaoId}`,
                      });
                    } catch (_) {}
                } else {
                    const nomeItem = (doacaoData?.doacao?.descricao_item ?? item ?? '').toString().trim();
                    if (!nomeItem) {
                        await conn.rollback();
                        conn.release();
                        throw new Error("Descrição do item é obrigatória");
                    }
                    const estado = doacaoData?.doacao?.estado_conservacao ?? 'Bom';
                    await conn.execute(`INSERT INTO doacoes_itens (doacao_id, descricao_item, quantidade, estado_conservacao, unidade_medida) VALUES (?, ?, ?, ?, ?)`, [doacaoId, nomeItem, qty, estado, unidadeIns]);
                    const { id: produtoId } = await upsertProdutoFast(conn, { nome: nomeItem, categoria: 'Outros', unidade: unidadeIns });
                    await conn.execute(`UPDATE produtos SET categoria = ?, unidade_medida = ?, quantidade = quantidade + ? WHERE id = ?`, ['Outros', unidadeIns, qty, produtoId]);
                    try {
                      const [afterRows] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [produtoId]);
                      const saldoPosterior = Array.isArray(afterRows) && afterRows.length ? Number(afterRows[0].quantidade) : qty;
                      const saldoAnterior = Math.max(0, saldoPosterior - qty);
                      await MovimentoEstoqueRepository.createWithConn(conn, {
                        produto_id: produtoId,
                        tipo: 'entrada',
                        quantidade: qty,
                        saldo_anterior: saldoAnterior,
                        saldo_posterior: saldoPosterior,
                        doacao_id: doacaoId,
                        responsavel_id: null,
                        responsavel_nome: null,
                        motivo: 'Doação de item',
                        observacao: `Doação #${doacaoId}`,
                      });
                    } catch (_) {}
                }
                await conn.commit();
                conn.release();
                return await this.findById(doacaoId);
            }
        } catch (error) {
            // Fallback sem coluna idoso_id
            try {
                const { data, tipo, obs, evento, eventoId } = doacaoData;
                const { item, qntd, valor } = doacaoData.doacao || {};
                const {doadorId} = doacaoData.doador
                const idosoNome = doacaoData.idoso?.nome || doacaoData.idoso || null;
                await conn.beginTransaction();
                if (String(tipo || '').toUpperCase() === "D") {
                    if (!data || String(data).trim().length === 0) throw new Error("Data da doação é obrigatória");
                    if (!tipo || String(tipo).trim().length === 0) throw new Error("Tipo de doação é obrigatório");
                    const [result] = await conn.execute(`INSERT INTO doacoes (
                    data, tipo, obs, doador, idoso, evento_id) VALUES ( ?, ?, ?, ?, ?, ?)`, [data, tipo, (obs ?? null), doadorId, (idosoNome ?? null), (eventoId ?? null)]);
                    const doacaoId = result.insertId;
                    // ... existing code ...
                    const [colChk] = await conn.query(`
                        SELECT COUNT(*) AS cnt
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'doacaodinheiro'
                          AND column_name = 'financeiro_id'
                    `);
                    const hasFinanceiroIdCol = colChk && colChk[0] && Number(colChk[0].cnt) > 0;
                    if (hasFinanceiroIdCol) {
                        const [financeiroTable] = await conn.query("SHOW TABLES LIKE 'financeiro'");
                        const hasFinanceiroTable = Array.isArray(financeiroTable) && financeiroTable.length > 0;
                        let financeiroId = null;
                        if (hasFinanceiroTable) {
                            const descricao = `Doação em dinheiro - ${doacaoData.doador?.nome || 'Doador ' + doadorId}`;
                            const [finRes] = await conn.execute(
                                `INSERT INTO financeiro (descricao, valor, tipo, categoria, forma_pagamento, recorrente, frequencia_recorrencia, ocorrencias_recorrencia, data, observacao) 
                                 VALUES (?, ?, 'Entrada', 'Doações', 'Dinheiro', 0, NULL, NULL, ?, ?)`,
                                [descricao, Number(valor), data, (obs ?? null)]
                            );
                            financeiroId = finRes.insertId;
                        }
                        const valorNum = Number(valor);
                        if (!valorNum || valorNum <= 0 || Number.isNaN(valorNum)) throw new Error("Valor de doação em dinheiro inválido");
                        await conn.execute(`INSERT INTO doacoes_dinheiro (doacao_id, valor, forma_pagamento, comprovante, financeiro_id) VALUES (?, ?, 'Dinheiro', NULL, ?)`, [doacaoId, valorNum, financeiroId ?? null]);
                    } else {
                        const valorNum = Number(valor);
                        if (!valorNum || valorNum <= 0 || Number.isNaN(valorNum)) throw new Error("Valor de doação em dinheiro inválido");
                        await conn.execute(`INSERT INTO doacoes_dinheiro (doacao_id, valor, forma_pagamento, comprovante) VALUES (?, ?, 'Dinheiro', NULL)`, [doacaoId, valorNum]);
                    }
                    await conn.commit();
                    conn.release();
                    return await this.findById(doacaoId);
                } else {
                    if (!data || String(data).trim().length === 0) throw new Error("Data da doação é obrigatória");
                    if (!tipo || String(tipo).trim().length === 0) throw new Error("Tipo de doação é obrigatório");
                    const [result] = await conn.execute(`INSERT INTO doacoes (
                    data, tipo, obs, doador, idoso, evento_id) VALUES ( ?, ?, ?, ?, ?, ?)`, [data, tipo, (obs ?? null), doadorId, (idosoNome ?? null), (eventoId ?? null)]);
                    const doacaoId = result.insertId;
                    // Upsert rápido de produto e obtenção de id sem múltiplos SELECTs
                    const categoria = (String(doacaoData?.tipo || '').toUpperCase() === 'A' ? 'Alimentos' : 'Outros');
                    const unidade = (doacaoData?.doacao?.unidade_medida ?? 'Unidade(s)');
                    const nomeItem = (item ?? '').toString().trim();
                    if (!nomeItem) throw new Error("Descrição do item é obrigatória");
                    const { id: produtoId } = await upsertProdutoFast(conn, { nome: nomeItem, categoria, unidade });
                    // Validação de quantidade positiva
                    if (!qntd || Number(qntd) <= 0) {
                        await conn.rollback();
                        conn.release();
                        throw new Error("Quantidade doada inválida");
                    }
                    // Verificar duplicidade imediata (mesma data/doador/produto/quantidade)
                    const [dupRows] = await conn.execute(
                        `SELECT COUNT(*) AS cnt
                         FROM doacoes d
                         JOIN doacaoproduto dp ON dp.doacao_id = d.id
                         WHERE d.doador = ? AND d.tipo = ? AND d.data = ? AND dp.produto_id = ? AND dp.quantidade = ?`,
                        [doadorId, tipo, data, produtoId, qntd]
                    );
                    const dupCnt = Array.isArray(dupRows) && dupRows.length ? Number(dupRows[0].cnt) : 0;
                    if (dupCnt > 0) {
                        await conn.rollback();
                        conn.release();
                        throw new Error("Doação duplicada detectada para o mesmo produto e quantidade");
                    }

                    // Harmonizar categoria/unidade
                    
                    // Registrar item da doação
                    await conn.execute(`INSERT INTO doacaoproduto (doacao_id, produto_id, unidade_medida, quantidade, observacao) VALUES (?, ?, ?, ?, ?)`, [doacaoId, produtoId, unidade, qntd, null]);
                    // Atualiza estoque em uma única operação
                    await conn.execute(`UPDATE produtos SET categoria = ?, unidade_medida = ?, quantidade = quantidade + ? WHERE id = ?`, [categoria, unidade, Number(qntd), produtoId]);
                    await conn.commit();
                    conn.release();
                    return await this.findById(doacaoId);
                }
            } catch (fallbackErr) {
                await conn.rollback();
                throw new Error(`Erro ao gravar doação: ${fallbackErr.message}`);
            }
        }
    }

    async update(id, doacaoData) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const { data, tipo, obs, evento, eventoId } = doacaoData;
            const { item, qntd, valor } = doacaoData.doacao;
            const {doadorId, nome} = doacaoData.doador
            const idosoId = doacaoData.idoso?.id || doacaoData.idosoId || null;
            const idosoNome = doacaoData.idoso?.nome || doacaoData.idoso || null;
            if (tipo.toUpperCase() === "D") {
                await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, idoso_id = ?, evento_id = ? WHERE id = ?`,
                    [data, tipo, obs, doadorId, idosoNome, idosoId, eventoId ?? null, id]);
                const forma = doacaoData?.doacao?.forma_pagamento ?? 'Dinheiro';
                const comp = doacaoData?.doacao?.comprovante ?? null;
                await conn.execute(`UPDATE doacoes_dinheiro SET valor = ?, forma_pagamento = ?, comprovante = ? WHERE doacao_id = ?`, [valor, forma, comp, id]);
                // Se existir coluna financeiro_id, propaga atualização para tabela financeiro
                const { hasFinanceiroId: hasFinanceiroIdCol } = await ensureFinanceiroSchema(conn);
                if (hasFinanceiroIdCol) {
                    const [rowsFin] = await conn.execute(`SELECT financeiro_id FROM doacoes_dinheiro WHERE doacao_id = ? LIMIT 1`, [id]);
                    const finId = rowsFin && rowsFin[0] && rowsFin[0].financeiro_id ? rowsFin[0].financeiro_id : null;
                    if (finId) {
                        await conn.execute(
                            `UPDATE financeiro SET valor = ?, data = ?, observacao = ?, descricao = ? WHERE id = ?`,
                            [
                                valor,
                                data,
                                obs || null,
                                `Doação em dinheiro - ${nome || doacaoData.doador?.nome || 'Doador ' + doadorId}`,
                                finId
                            ]
                        );
                    } else {
                        const [finRes] = await conn.execute(
                            `INSERT INTO financeiro (descricao, valor, tipo, categoria, forma_pagamento, recorrente, frequencia_recorrencia, ocorrencias_recorrencia, data, observacao) 
                             VALUES (?, ?, 'Entrada', 'Doações', 'Dinheiro', 0, NULL, NULL, ?, ?)`,
                            [`Doação em dinheiro - ${nome || doacaoData.doador?.nome || 'Doador ' + doadorId}`, valor, data, obs || null]
                        );
                        const newFinId = finRes.insertId;
                        await conn.execute(`UPDATE doacoes_dinheiro SET financeiro_id = ? WHERE doacao_id = ?`, [newFinId, id]);
                    }
                }
                await conn.commit();
                conn.release();
            } else {
                await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, idoso_id = ?, evento_id = ? WHERE id = ?`,
                    [data, tipo, obs, doadorId, idosoNome, idosoId, eventoId ?? null, id]);
                const unidade = (doacaoData?.doacao?.unidade_medida ?? 'Unidade(s)');
                const newQty = Number(doacaoData?.doacao?.qntd ?? doacaoData?.doacao?.quantidade ?? 0);
                if (!newQty || newQty <= 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Quantidade atualizada inválida");
                }
                const tipoNorm = (t) => {
                    const v = String(t || '').toUpperCase();
                    if (v === 'D' || v === 'DINHEIRO') return 'DINHEIRO';
                    if (v === 'A' || v === 'ALIMENTO') return 'ALIMENTO';
                    if (v === 'O' || v === 'OUTROS' || v === 'OUTRO') return 'OUTROS';
                    return v;
                };
                if (tipoNorm(tipo) === 'ALIMENTO') {
                    const [prevRows] = await conn.execute(`SELECT tipo_alimento, quantidade FROM doacoes_alimentos WHERE doacao_id = ? LIMIT 1`, [id]);
                    const prevNome = prevRows && prevRows[0] ? String(prevRows[0].tipo_alimento) : (doacaoData?.doacao?.tipo_alimento || item);
                    const prevQty = prevRows && prevRows[0] ? Number(prevRows[0].quantidade) : 0;
                    const nomeAlimento = String(doacaoData?.doacao?.tipo_alimento || item || prevNome);
                    await conn.execute(`UPDATE doacoes_alimentos SET tipo_alimento = ?, quantidade = ?, validade = ? WHERE doacao_id = ?`, [nomeAlimento, newQty, doacaoData?.doacao?.validade ?? null, id]);
                    const { id: prevProdId } = await upsertProdutoFast(conn, { nome: prevNome, categoria: 'Alimentos', unidade });
                    const { id: newProdId } = await upsertProdutoFast(conn, { nome: nomeAlimento, categoria: 'Alimentos', unidade });
                    if (prevProdId === newProdId) {
                        const delta = newQty - prevQty;
                        if (delta !== 0) {
                            await conn.execute(`UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`, [delta, newProdId]);
                            try {
                                const [afterRows] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [newProdId]);
                                const saldoPosterior = Array.isArray(afterRows) && afterRows.length ? Number(afterRows[0].quantidade) : delta;
                                const saldoAnterior = saldoPosterior - delta;
                                await MovimentoEstoqueRepository.createWithConn(conn, {
                                    produto_id: newProdId,
                                    tipo: delta > 0 ? 'entrada' : 'saida',
                                    quantidade: Math.abs(delta),
                                    saldo_anterior: saldoAnterior,
                                    saldo_posterior: saldoPosterior,
                                    doacao_id: id,
                                    responsavel_id: null,
                                    responsavel_nome: null,
                                    motivo: delta > 0 ? 'Ajuste de doação (entrada)' : 'Ajuste de doação (saída)',
                                    observacao: `Atualização da doação #${id}`,
                                });
                            } catch (_) {}
                        }
                    } else {
                        if (prevQty > 0 && prevProdId) {
                            await conn.execute(`UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?`, [prevQty, prevProdId]);
                            try {
                                const [afterPrev] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [prevProdId]);
                                const saldoPosterior = Array.isArray(afterPrev) && afterPrev.length ? Number(afterPrev[0].quantidade) : 0;
                                const saldoAnterior = saldoPosterior + prevQty;
                                await MovimentoEstoqueRepository.createWithConn(conn, {
                                    produto_id: prevProdId,
                                    tipo: 'saida',
                                    quantidade: prevQty,
                                    saldo_anterior: saldoAnterior,
                                    saldo_posterior: saldoPosterior,
                                    doacao_id: id,
                                    responsavel_id: null,
                                    responsavel_nome: null,
                                    motivo: 'Reclassificação de doação (saída)',
                                    observacao: `Atualização da doação #${id}`,
                                });
                            } catch (_) {}
                        }
                        if (newQty > 0 && newProdId) {
                            await conn.execute(`UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`, [newQty, newProdId]);
                            try {
                                const [afterNew] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [newProdId]);
                                const saldoPosterior = Array.isArray(afterNew) && afterNew.length ? Number(afterNew[0].quantidade) : newQty;
                                const saldoAnterior = saldoPosterior - newQty;
                                await MovimentoEstoqueRepository.createWithConn(conn, {
                                    produto_id: newProdId,
                                    tipo: 'entrada',
                                    quantidade: newQty,
                                    saldo_anterior: saldoAnterior,
                                    saldo_posterior: saldoPosterior,
                                    doacao_id: id,
                                    responsavel_id: null,
                                    responsavel_nome: null,
                                    motivo: 'Reclassificação de doação (entrada)',
                                    observacao: `Atualização da doação #${id}`,
                                });
                            } catch (_) {}
                        }
                    }
                } else {
                    const [prevRows] = await conn.execute(`SELECT descricao_item, quantidade FROM doacoes_itens WHERE doacao_id = ? LIMIT 1`, [id]);
                    const prevNome = prevRows && prevRows[0] ? String(prevRows[0].descricao_item) : (doacaoData?.doacao?.descricao_item || item);
                    const prevQty = prevRows && prevRows[0] ? Number(prevRows[0].quantidade) : 0;
                    const nomeItem = String(doacaoData?.doacao?.descricao_item || item || prevNome);
                    await conn.execute(`UPDATE doacoes_itens SET descricao_item = ?, quantidade = ?, estado_conservacao = ?, unidade_medida = ? WHERE doacao_id = ?`, [nomeItem, newQty, doacaoData?.doacao?.estado_conservacao ?? 'Bom', unidade, id]);
                    const { id: prevProdId } = await upsertProdutoFast(conn, { nome: prevNome, categoria: 'Outros', unidade });
                    const { id: newProdId } = await upsertProdutoFast(conn, { nome: nomeItem, categoria: 'Outros', unidade });
                    if (prevProdId === newProdId) {
                        const delta = newQty - prevQty;
                        if (delta !== 0) {
                            await conn.execute(`UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`, [delta, newProdId]);
                            try {
                                const [afterRows] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [newProdId]);
                                const saldoPosterior = Array.isArray(afterRows) && afterRows.length ? Number(afterRows[0].quantidade) : delta;
                                const saldoAnterior = saldoPosterior - delta;
                                await MovimentoEstoqueRepository.createWithConn(conn, {
                                    produto_id: newProdId,
                                    tipo: delta > 0 ? 'entrada' : 'saida',
                                    quantidade: Math.abs(delta),
                                    saldo_anterior: saldoAnterior,
                                    saldo_posterior: saldoPosterior,
                                    doacao_id: id,
                                    responsavel_id: null,
                                    responsavel_nome: null,
                                    motivo: delta > 0 ? 'Ajuste de doação (entrada)' : 'Ajuste de doação (saída)',
                                    observacao: `Atualização da doação #${id}`,
                                });
                            } catch (_) {}
                        }
                    } else {
                        if (prevQty > 0 && prevProdId) {
                            await conn.execute(`UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?`, [prevQty, prevProdId]);
                            try {
                                const [afterPrev] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [prevProdId]);
                                const saldoPosterior = Array.isArray(afterPrev) && afterPrev.length ? Number(afterPrev[0].quantidade) : 0;
                                const saldoAnterior = saldoPosterior + prevQty;
                                await MovimentoEstoqueRepository.createWithConn(conn, {
                                    produto_id: prevProdId,
                                    tipo: 'saida',
                                    quantidade: prevQty,
                                    saldo_anterior: saldoAnterior,
                                    saldo_posterior: saldoPosterior,
                                    doacao_id: id,
                                    responsavel_id: null,
                                    responsavel_nome: null,
                                    motivo: 'Reclassificação de doação (saída)',
                                    observacao: `Atualização da doação #${id}`,
                                });
                            } catch (_) {}
                        }
                        if (newQty > 0 && newProdId) {
                            await conn.execute(`UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`, [newQty, newProdId]);
                            try {
                                const [afterNew] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [newProdId]);
                                const saldoPosterior = Array.isArray(afterNew) && afterNew.length ? Number(afterNew[0].quantidade) : newQty;
                                const saldoAnterior = saldoPosterior - newQty;
                                await MovimentoEstoqueRepository.createWithConn(conn, {
                                    produto_id: newProdId,
                                    tipo: 'entrada',
                                    quantidade: newQty,
                                    saldo_anterior: saldoAnterior,
                                    saldo_posterior: saldoPosterior,
                                    doacao_id: id,
                                    responsavel_id: null,
                                    responsavel_nome: null,
                                    motivo: 'Reclassificação de doação (entrada)',
                                    observacao: `Atualização da doação #${id}`,
                                });
                            } catch (_) {}
                        }
                    }
                }
                await conn.commit();
                conn.release();
            }
            return await this.findById(id);
        } catch (error) {
            // Fallback sem coluna idoso_id
            try {
                await conn.beginTransaction();
                const { data, tipo, obs, evento, eventoId } = doacaoData;
                const { item, qntd, valor } = doacaoData.doacao;
                const { doadorId } = doacaoData.doador;
                const idosoNome = doacaoData.idoso?.nome || doacaoData.idoso || null;
                if (tipo.toUpperCase() === "D") {
                    await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, evento_id = ? WHERE id = ?`,
                        [data, tipo, obs, doadorId, idosoNome, eventoId ?? null, id]);
                    await conn.execute(`UPDATE doacoes_dinheiro SET valor = ? WHERE doacao_id = ?`, [valor, id]);
                    const { hasFinanceiroId: hasFinanceiroIdCol } = await ensureFinanceiroSchema(conn);
                    if (hasFinanceiroIdCol) {
                        const [rowsFin] = await conn.execute(`SELECT financeiro_id FROM doacoes_dinheiro WHERE doacao_id = ? LIMIT 1`, [id]);
                        const finId = rowsFin && rowsFin[0] && rowsFin[0].financeiro_id ? rowsFin[0].financeiro_id : null;
                        if (finId) {
                            await conn.execute(
                                `UPDATE financeiro SET valor = ?, data = ?, observacao = ?, descricao = ? WHERE id = ?`,
                                [valor, data, obs || null, `Doação em dinheiro - ${doacaoData.doador?.nome || 'Doador ' + doadorId}`, finId]
                            );
                        } else {
                            const [finRes] = await conn.execute(
                                `INSERT INTO financeiro (descricao, valor, tipo, categoria, forma_pagamento, recorrente, frequencia_recorrencia, ocorrencias_recorrencia, data, observacao) 
                                 VALUES (?, ?, 'Entrada', 'Doações', 'Dinheiro', 0, NULL, NULL, ?, ?)`,
                                [`Doação em dinheiro - ${doacaoData.doador?.nome || 'Doador ' + doadorId}`, valor, data, obs || null]
                            );
                            const newFinId = finRes.insertId;
                            await conn.execute(`UPDATE doacoes_dinheiro SET financeiro_id = ? WHERE doacao_id = ?`, [newFinId, id]);
                        }
                    }
                    await conn.commit();
                    conn.release();
                } else {
                    await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, evento_id = ? WHERE id = ?`,
                        [data, tipo, obs, doadorId, idosoNome, eventoId ?? null, id]);
                    // Este bloco foi substituído pela lógica de atualização específica para cada tipo de doação (alimentos e itens).
                    // A tabela `doacaoproduto` não é mais utilizada diretamente para atualizações.
                    // A lógica de atualização foi movida para dentro dos blocos `if (tipoNorm(tipo) === 'ALIMENTO')` e `else` no método `update`.
                    await conn.commit();
                    conn.release();
                }
                return await this.findById(id);
            } catch (fallbackErr) {
                throw new Error(`Erro ao atualizar doação: ${fallbackErr.message}`);
            }
        }
    }

    async findByEventoId(eventoId, { tipo = "todos", data = "todos", destinatario = "todos", busca = "" } = {}) {
        if (!eventoId) throw new Error("eventoId é obrigatório");
        return this.findByFiltred(tipo, data, destinatario, busca, eventoId);
    }

    async delete(id) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Buscar IDs financeiros relacionados a doações em dinheiro
            let finIds = [];
                try {
                const { hasFinanceiroId: hasFinanceiroIdCol } = await ensureFinanceiroSchema(conn);
                if (hasFinanceiroIdCol) {
                    const [rows] = await conn.execute(`SELECT financeiro_id FROM doacoes_dinheiro WHERE doacao_id = ?`, [id]);
                    finIds = (rows || []).map(r => r.financeiro_id).filter(v => v != null);
                }
            } catch {}

            // Remove registros filhos primeiro para evitar problemas de integridade referencial
            await conn.execute(`DELETE FROM doacoes_dinheiro WHERE doacao_id = ?`, [id]);
            await conn.execute(`DELETE FROM doacoes_alimentos WHERE doacao_id = ?`, [id]);
            await conn.execute(`DELETE FROM doacoes_itens WHERE doacao_id = ?`, [id]);

            // Remover registros no financeiro, se existirem
            if (finIds.length > 0) {
                const placeholders = finIds.map(() => '?').join(',');
                await conn.execute(`DELETE FROM financeiro WHERE id IN (${placeholders})`, finIds);
            }

            // Remove a doação principal
            const [result] = await conn.execute(`DELETE FROM doacoes WHERE id = ?`, [id]);

            if (result.affectedRows > 0) {
                await conn.commit();
                conn.release();
                return true;
            } else {
                await conn.rollback();
                conn.release();
                return false;
            }
        } catch (error) {
            await conn.rollback();
            conn.release();
            throw new Error(`Erro ao deletar doação: ${error.message}`);
        }
    }

    async getDoadorByName(nome) {
        try {
            const key = String(nome || '').toLowerCase();
            const cached = nameCache.get(key);
            if (cached) return cached;
            // Otimiza consulta: tenta busca por prefixo para aproveitar índice em nome; faz fallback para contém
            const [prefRows] = await db.execute("SELECT id, nome FROM doadores WHERE nome LIKE ?", [`${nome}%`]);
            if (prefRows.length > 0) {
                nameCache.set(key, prefRows);
                return prefRows;
            }
            const [rows] = await db.execute("SELECT id, nome FROM doadores WHERE nome LIKE ?", [`%${nome}%`]);
            nameCache.set(key, rows);
            return rows;
        } catch (error) {
            throw new Error("Erro ao buscar doador: " + error.message);
        }
    }
}

module.exports = new DoacaoRepository();
