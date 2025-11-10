const db = require("../config/database");
const LRUCache = require('../utils/lruCache');
const nameCache = new LRUCache(1000);
const Doacao = require("../models/doacao");
const { computeStockUpdate } = require("../utils/stockUpdateGuard");
const MovimentoEstoqueRepository = require('./movimentoEstoqueRepository');
const ProdutoBackupRepository = require('./produtoBackupRepository');
const { resolveProduto, upsertProdutoFast } = require('../utils/produtoResolver');

class DoacaoRepository {
    async findAll() {
        try {
            const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, d.evento_id AS eventoId,
            dd.id as dinheiroId, dd.valor,
            dp.id as produtoId, p.nome AS item, dp.quantidade AS qntd, dp.unidade_medida AS unidade_medida,
            dr.id as doadorId, dr.nome as doadorNome,
            e.titulo AS eventoTitulo
            FROM doacoes d
            LEFT JOIN doacaodinheiro dd ON dd.id = (SELECT MIN(id) FROM doacaodinheiro WHERE doacao_id = d.id)
            LEFT JOIN doacaoproduto dp ON dp.id = (SELECT MIN(id) FROM doacaoproduto WHERE doacao_id = d.id)
            LEFT JOIN produtos p ON dp.produto_id = p.id
            LEFT JOIN doadores dr ON d.doador = dr.id
            LEFT JOIN eventos e ON d.evento_id = e.id`)
            return rows.map(rows => new Doacao(rows));
        } catch (error) {
            // Fallback para bancos ainda sem coluna idoso_id
            try {
                const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.evento_id AS eventoId,
                dd.id as dinheiroId, dd.valor,
                dp.id as produtoId, p.nome AS item, dp.quantidade AS qntd, dp.unidade_medida AS unidade_medida,
                dr.id as doadorId, dr.nome as doadorNome,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacaodinheiro dd ON dd.id = (SELECT MIN(id) FROM doacaodinheiro WHERE doacao_id = d.id)
                LEFT JOIN doacaoproduto dp ON dp.id = (SELECT MIN(id) FROM doacaoproduto WHERE doacao_id = d.id)
                LEFT JOIN produtos p ON dp.produto_id = p.id
                LEFT JOIN doadores dr ON d.doador = dr.id
                LEFT JOIN eventos e ON d.evento_id = e.id`);
                return rows.map(rows => new Doacao(rows));
            } catch (fallbackErr) {
                throw new Error(`Erro ao buscar doação: ${fallbackErr.message}`);
            }
        }
    }

    async findById(id) {
        try {
            const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, i.nome as idosoNome, d.evento_id AS eventoId,
            dd.id as dinheiroId, dd.valor,
            dp.id as produtoId, p.nome AS item, dp.quantidade AS qntd, dp.unidade_medida AS unidade_medida,
            dr.id as doadorId, dr.nome as doadorNome,
            e.titulo AS eventoTitulo
            FROM doacoes d 
            LEFT JOIN idosos i ON d.idoso_id = i.id
            LEFT JOIN doacaodinheiro dd ON dd.id = (SELECT MIN(id) FROM doacaodinheiro WHERE doacao_id = d.id)
            LEFT JOIN doacaoproduto dp ON dp.id = (SELECT MIN(id) FROM doacaoproduto WHERE doacao_id = d.id)
            LEFT JOIN produtos p ON dp.produto_id = p.id
            LEFT JOIN doadores dr ON d.doador = dr.id
            LEFT JOIN eventos e ON d.evento_id = e.id
            WHERE d.id = ?`, [id]);
            if (rows.length === 0) return null;
            return new Doacao(rows[0])
        } catch (error) {
            // Fallback para bancos ainda sem coluna idoso_id
            try {
                const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.idoso as idosoNome, d.evento_id AS eventoId,
                dd.id as dinheiroId, dd.valor,
                dp.id as produtoId, p.nome AS item, dp.quantidade AS qntd, dp.unidade_medida AS unidade_medida,
                dr.id as doadorId, dr.nome as doadorNome,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacaodinheiro dd ON dd.id = (SELECT MIN(id) FROM doacaodinheiro WHERE doacao_id = d.id)
                LEFT JOIN doacaoproduto dp ON dp.id = (SELECT MIN(id) FROM doacaoproduto WHERE doacao_id = d.id)
                LEFT JOIN produtos p ON dp.produto_id = p.id
                LEFT JOIN doadores dr ON d.doador = dr.id
                LEFT JOIN eventos e ON d.evento_id = e.id
                WHERE d.id = ?`, [id]);
                if (rows.length === 0) return null;
                return new Doacao(rows[0]);
            } catch (fallbackErr) {
                throw new Error(`Erro ao buscar doação: ${fallbackErr.message}`);
            }
        }
    }

    async findByDoadorId(doadorId) {
        try {
            const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, d.evento_id AS eventoId,
            dd.id as dinheiroId, dd.valor,
            dp.id as produtoId, p.nome AS item, dp.quantidade AS qntd, dp.unidade_medida AS unidade_medida,
            dr.id as doadorId, dr.nome as doadorNome,
            e.titulo AS eventoTitulo
            FROM doacoes d
            LEFT JOIN doacaodinheiro dd ON dd.id = (SELECT MIN(id) FROM doacaodinheiro WHERE doacao_id = d.id)
            LEFT JOIN doacaoproduto dp ON dp.id = (SELECT MIN(id) FROM doacaoproduto WHERE doacao_id = d.id)
            LEFT JOIN produtos p ON dp.produto_id = p.id
            LEFT JOIN doadores dr ON d.doador = dr.id
            LEFT JOIN eventos e ON d.evento_id = e.id
            WHERE d.doador = ?`;
            const [rows] = await db.execute(sql, [Number(doadorId)]);
            return rows.map(r => new Doacao(r));
        } catch (error) {
            // Fallback para bancos sem coluna idoso_id (mantém joins equivalentes)
            try {
                const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.evento_id AS eventoId,
                dd.id as dinheiroId, dd.valor,
                dp.id as produtoId, p.nome AS item, dp.quantidade AS qntd, dp.unidade_medida AS unidade_medida,
                dr.id as doadorId, dr.nome as doadorNome,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacaodinheiro dd ON d.id = dd.doacao_id
                LEFT JOIN doacaoproduto dp ON d.id = dp.doacao_id
                LEFT JOIN produtos p ON dp.produto_id = p.id
                LEFT JOIN doadores dr ON d.doador = dr.id
                LEFT JOIN eventos e ON d.evento_id = e.id
                WHERE d.doador = ?`;
                const [rows] = await db.execute(sql, [Number(doadorId)]);
                return rows.map(r => new Doacao(r));
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

            if (destinatario !== "todos") {
                if (destinatario === "instituicao") {
                    // Suporta tanto o schema novo (idoso_id) quanto legado (texto em d.idoso) e variações com/sem acento
                    where.push("(d.idoso_id IS NULL OR LOWER(d.idoso) LIKE ? OR LOWER(d.idoso) LIKE ?)");
                    params.push("%instituição%", "%instituicao%");
                } else if (destinatario === "idosos") {
                    where.push("(d.idoso_id IS NOT NULL OR LOWER(d.idoso) LIKE ?)");
                    params.push("%quarto%");
                }
            }

            if (busca && busca.trim() !== "") {
                const buscaParam = `%${busca.toLowerCase()}%`;
                where.push(`(
                    LOWER(p.nome) LIKE ? OR
                    CAST(dp.quantidade AS CHAR) LIKE ? OR
                    CAST(dd.valor AS CHAR) LIKE ? OR
                    LOWER(d.idoso) LIKE ? OR
                    LOWER(e.titulo) LIKE ? OR
                    LOWER(d.obs) LIKE ? OR
                    LOWER(dr.nome) LIKE ?
                )`);
                params.push(buscaParam, buscaParam, buscaParam, buscaParam, buscaParam, buscaParam, buscaParam);
            }

            if (eventoId && !isNaN(Number(eventoId))) {
                where.push("(d.evento_id = ?)");
                params.push(Number(eventoId));
            }

            const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, d.evento_id AS eventoId,
            dd.id as dinheiroId, dd.valor,
            dp.id as produtoId, p.nome AS item, dp.quantidade AS qntd, dp.unidade_medida AS unidade_medida,
            dr.id as doadorId, dr.nome as doadorNome,
            e.titulo AS eventoTitulo
            FROM doacoes d
            LEFT JOIN doacaodinheiro dd ON dd.id = (SELECT MIN(id) FROM doacaodinheiro WHERE doacao_id = d.id)
            LEFT JOIN doacaoproduto dp ON dp.id = (SELECT MIN(id) FROM doacaoproduto WHERE doacao_id = d.id)
            LEFT JOIN produtos p ON dp.produto_id = p.id
            LEFT JOIN doadores dr ON d.doador = dr.id
            LEFT JOIN eventos e ON d.evento_id = e.id ${where.length > 0 ? " WHERE " + where.join(" AND ") : ""}`;
            const [rows] = await db.execute(sql, params);
            return rows.map(rows => new Doacao(rows));
        } catch (error) {
            // Fallback sem referência à coluna idoso_id
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

                if (destinatario !== "todos") {
                    if (destinatario === "instituicao") {
                        // Variação com/sem acento para dados legados no campo texto
                        where.push("(LOWER(d.idoso) LIKE ? OR LOWER(d.idoso) LIKE ?)");
                        params.push("%instituição%", "%instituicao%");
                    } else if (destinatario === "idosos") {
                        where.push("LOWER(d.idoso) LIKE ?");
                        params.push("%quarto%");
                    }
                }

                if (busca && busca.trim() !== "") {
                    const buscaParam = `%${busca.toLowerCase()}%`;
                    where.push(`(
                        LOWER(p.nome) LIKE ? OR
                        CAST(dp.quantidade AS CHAR) LIKE ? OR
                        CAST(dd.valor AS CHAR) LIKE ? OR
                        LOWER(d.idoso) LIKE ? OR
                        LOWER(e.titulo) LIKE ? OR
                        LOWER(d.obs) LIKE ? OR
                        LOWER(dr.nome) LIKE ?
                    )`);
                    params.push(buscaParam, buscaParam, buscaParam, buscaParam, buscaParam, buscaParam, buscaParam);
                }

                if (eventoId && !isNaN(Number(eventoId))) {
                    where.push("(d.evento_id = ?)");
                    params.push(Number(eventoId));
                }

                const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.evento_id AS eventoId,
                dd.id as dinheiroId, dd.valor,
                dp.id as produtoId, p.nome AS item, dp.quantidade AS qntd, dp.unidade_medida AS unidade_medida,
                dr.id as doadorId, dr.nome as doadorNome,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacaodinheiro dd ON d.id = dd.doacao_id
                LEFT JOIN doacaoproduto dp ON d.id = dp.doacao_id
                LEFT JOIN produtos p ON dp.produto_id = p.id
                LEFT JOIN doadores dr ON d.doador = dr.id
                LEFT JOIN eventos e ON d.evento_id = e.id ${where.length > 0 ? " WHERE " + where.join(" AND ") : ""}`;
                const [rows] = await db.execute(sql, params);
                return rows.map(rows => new Doacao(rows));
            } catch (fallbackErr) {
                throw new Error("Erro ao filtrar doações: " + fallbackErr.message)
            }
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
            if (tipo.toUpperCase() === "D") {
                const [result] = await conn.execute(`INSERT INTO doacoes (
                data, tipo, obs, doador, idoso, idoso_id, evento_id) VALUES ( ?, ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doadorId, idosoNome, idosoId, eventoId ?? null]);
                const doacaoId = result.insertId;
                // Integração com financeiro quando coluna financeiro_id existe
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
                        const descricao = `Doação em dinheiro - ${nome || doacaoData.doador?.nome || 'Doador ' + doadorId}`;
                        const dataFin = data;
                        const observacaoFin = obs || null;
                        const [finRes] = await conn.execute(
                            `INSERT INTO financeiro (descricao, valor, tipo, categoria, forma_pagamento, recorrente, frequencia_recorrencia, ocorrencias_recorrencia, data, observacao) 
                             VALUES (?, ?, 'Entrada', 'Doações', 'Dinheiro', 0, NULL, NULL, ?, ?)`,
                            [descricao, valor, dataFin, observacaoFin]
                        );
                        financeiroId = finRes.insertId;
                    }

                    if (hasFinanceiroTable) {
                        await conn.execute(`INSERT INTO doacaodinheiro (doacao_id, valor, financeiro_id) VALUES (?, ?, ?)`, [doacaoId, valor, financeiroId]);
                    } else {
                        await conn.execute(`INSERT INTO doacaodinheiro (doacao_id, valor, financeiro_id) VALUES (?, ?, NULL)`, [doacaoId, valor]);
                    }
                } else {
                    await conn.execute(`INSERT INTO doacaodinheiro (doacao_id, valor) VALUES (?, ?)`, [doacaoId, valor]);
                }
                await conn.commit();
                conn.release();
                return await this.findById(doacaoId);
            } else {
                const [result] = await conn.execute(`INSERT INTO doacoes (
                data, tipo, obs, doador, idoso, idoso_id, evento_id) VALUES ( ?, ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doadorId, idosoNome, idosoId, eventoId ?? null]);
                const doacaoId = result.insertId;
                // Upsert rápido de produto e obtenção de id
                const categoriaIns = (doacaoData?.tipo === 'A' ? 'Alimentos' : 'Outros');
                const unidadeIns = (doacaoData?.doacao?.unidade_medida ?? 'Unidade');
                const { id: produtoId } = await upsertProdutoFast(conn, { nome: item, categoria: categoriaIns, unidade: unidadeIns });
                // Validação de quantidade positiva
                if (!qntd || Number(qntd) <= 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Quantidade doada inválida");
                }

                // Verificar duplicidade imediata (mesma data/doador/produto/quantidade)
                const [dupRowsMain] = await conn.execute(
                    `SELECT COUNT(*) AS cnt
                     FROM doacoes d
                     JOIN doacaoproduto dp ON dp.doacao_id = d.id
                     WHERE d.doador = ? AND d.tipo = ? AND d.data = ? AND dp.produto_id = ? AND dp.quantidade = ?`,
                    [doadorId, tipo, data, produtoId, qntd]
                );
                const dupCntMain = Array.isArray(dupRowsMain) && dupRowsMain.length ? Number(dupRowsMain[0].cnt) : 0;
                if (dupCntMain > 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Doação duplicada detectada para o mesmo produto e quantidade");
                }

                const unidade = unidadeIns;
                await conn.execute(`INSERT INTO doacaoproduto (doacao_id, produto_id, unidade_medida, quantidade, observacao) VALUES (?, ?, ?, ?, ?)`, [doacaoId, produtoId, unidade, qntd, null]);
                // Atualiza estoque rapidamente
                await conn.execute(`UPDATE produtos SET categoria = ?, unidade_medida = ?, quantidade = quantidade + ? WHERE id = ?`, [categoriaIns, unidadeIns, Number(qntd), produtoId]);
                // Log simples de movimento de estoque com uma leitura
                try {
                  const [afterRows] = await conn.execute(`SELECT quantidade FROM produtos WHERE id = ?`, [produtoId]);
                  const saldoPosterior = Array.isArray(afterRows) && afterRows.length ? Number(afterRows[0].quantidade) : Number(qntd);
                  const saldoAnterior = Math.max(0, saldoPosterior - Number(qntd));
                  await MovimentoEstoqueRepository.create({
                    produto_id: produtoId,
                    tipo: 'entrada',
                    quantidade: Number(qntd),
                    saldo_anterior: saldoAnterior,
                    saldo_posterior: saldoPosterior,
                    doacao_id: doacaoId,
                    responsavel_id: null,
                    responsavel_nome: null,
                    motivo: 'Doação de item',
                    observacao: `Doação #${doacaoId}`,
                  });
                } catch (_) {}
                await conn.commit();
                conn.release();
                return await this.findById(doacaoId);
            }
        } catch (error) {
            // Fallback sem coluna idoso_id
            try {
                const { data, tipo, obs, evento, eventoId } = doacaoData;
                const { item, qntd, valor } = doacaoData.doacao;
                const {doadorId} = doacaoData.doador
                const idosoNome = doacaoData.idoso?.nome || doacaoData.idoso || null;
                await conn.beginTransaction();
                if (tipo.toUpperCase() === "D") {
                    const [result] = await conn.execute(`INSERT INTO doacoes (
                    data, tipo, obs, doador, idoso, evento_id) VALUES ( ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doadorId, idosoNome, eventoId ?? null]);
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
                                [descricao, valor, data, obs || null]
                            );
                            financeiroId = finRes.insertId;
                        }
                        if (hasFinanceiroTable) {
                            await conn.execute(`INSERT INTO doacaodinheiro (doacao_id, valor, financeiro_id) VALUES (?, ?, ?)`, [doacaoId, valor, financeiroId]);
                        } else {
                            await conn.execute(`INSERT INTO doacaodinheiro (doacao_id, valor, financeiro_id) VALUES (?, ?, NULL)`, [doacaoId, valor]);
                        }
                    } else {
                        await conn.execute(`INSERT INTO doacaodinheiro (doacao_id, valor) VALUES (?, ?)`, [doacaoId, valor]);
                    }
                    await conn.commit();
                    conn.release();
                    return await this.findById(doacaoId);
                } else {
                    const [result] = await conn.execute(`INSERT INTO doacoes (
                    data, tipo, obs, doador, idoso, evento_id) VALUES ( ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doadorId, idosoNome, eventoId ?? null]);
                    const doacaoId = result.insertId;
                    // Upsert rápido de produto e obtenção de id sem múltiplos SELECTs
                    const categoria = (doacaoData?.tipo === 'A' ? 'Alimentos' : 'Outros');
                    const unidade = (doacaoData?.doacao?.unidade_medida ?? 'Unidade');
                    const { id: produtoId } = await upsertProdutoFast(conn, { nome: item, categoria, unidade });
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
                await conn.execute(`UPDATE doacaodinheiro SET valor = ? WHERE doacao_id = ?`, [valor, id]);
                // Se existir coluna financeiro_id, propaga atualização para tabela financeiro
                const [colChk] = await conn.query(`
                    SELECT COUNT(*) AS cnt
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'doacaodinheiro'
                      AND column_name = 'financeiro_id'
                `);
                const hasFinanceiroIdCol = colChk && colChk[0] && Number(colChk[0].cnt) > 0;
                if (hasFinanceiroIdCol) {
                    const [rowsFin] = await conn.execute(`SELECT financeiro_id FROM doacaodinheiro WHERE doacao_id = ? LIMIT 1`, [id]);
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
                        await conn.execute(`UPDATE doacaodinheiro SET financeiro_id = ? WHERE doacao_id = ?`, [newFinId, id]);
                    }
                }
                await conn.commit();
                conn.release();
            } else {
                await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, idoso_id = ?, evento_id = ? WHERE id = ?`,
                    [data, tipo, obs, doadorId, idosoNome, idosoId, eventoId ?? null, id]);
                // Obter registro anterior para reconciliar estoque e manter o mesmo produto
                const [prevDoaRows] = await conn.execute(`SELECT produto_id, quantidade FROM doacaoproduto WHERE doacao_id = ? LIMIT 1`, [id]);
                const prevProdId = Array.isArray(prevDoaRows) && prevDoaRows.length ? prevDoaRows[0].produto_id : null;
                const prevQty = Array.isArray(prevDoaRows) && prevDoaRows.length ? Number(prevDoaRows[0].quantidade) : 0;
                if (!prevProdId) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Produto vinculado à doação não encontrado");
                }
                const categoria = (doacaoData?.tipo === 'A' ? 'Alimentos' : 'Outros');
                const unidade = (doacaoData?.doacao?.unidade_medida ?? 'Unidade');
                const newQty = Number(doacaoData?.doacao?.qntd ?? prevQty);
                if (!newQty || newQty <= 0) {
                    await conn.rollback();
                    conn.release();
                    throw new Error("Quantidade atualizada inválida");
                }
                // Validação: impedir renomear para nome já existente em outro produto
                const nomeNorm = String(item || '').trim().toLowerCase();
                const [dupRows] = await conn.execute(`SELECT id FROM produtos WHERE nome_norm = ? AND id <> ? LIMIT 1`, [nomeNorm, prevProdId]);
                if (Array.isArray(dupRows) && dupRows.length > 0) {
                    await conn.rollback();
                    conn.release();
                    const err = new Error("Já existe outro produto com este nome");
                    err.code = 'PRODUTO_NOME_DUPLICADO';
                    throw err;
                }
                // Atualiza o próprio produto preservando o mesmo ID
                await conn.execute(`UPDATE produtos SET nome = ?, categoria = ?, unidade_medida = ?, data_atualizacao = NOW() WHERE id = ?`, [item, categoria, unidade, prevProdId]);
                // Atualiza a linha de doação mantendo produto_id intacto
                await conn.execute(`UPDATE doacaoproduto SET unidade_medida = ?, quantidade = ? WHERE doacao_id = ?`, [unidade, newQty, id]);
                // Ajusta estoque por delta
                const delta = newQty - prevQty;
                if (delta !== 0) {
                    await conn.execute(`UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`, [delta, prevProdId]);
                    try {
                        await MovimentoEstoqueRepository.create({
                            produto_id: prevProdId,
                            tipo: delta > 0 ? 'entrada' : 'saida',
                            quantidade: Math.abs(delta),
                            saldo_anterior: null,
                            saldo_posterior: null,
                            doacao_id: id,
                            responsavel_id: null,
                            responsavel_nome: null,
                            motivo: delta > 0 ? 'Ajuste de doação (entrada)' : 'Ajuste de doação (saída)',
                            observacao: `Atualização da doação #${id}`,
                        });
                    } catch (_) {}
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
                    await conn.execute(`UPDATE doacaodinheiro SET valor = ? WHERE doacao_id = ?`, [valor, id]);
                    const [colChk] = await conn.query(`
                        SELECT COUNT(*) AS cnt
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'doacaodinheiro'
                          AND column_name = 'financeiro_id'
                    `);
                    const hasFinanceiroIdCol = colChk && colChk[0] && Number(colChk[0].cnt) > 0;
                    if (hasFinanceiroIdCol) {
                        const [rowsFin] = await conn.execute(`SELECT financeiro_id FROM doacaodinheiro WHERE doacao_id = ? LIMIT 1`, [id]);
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
                            await conn.execute(`UPDATE doacaodinheiro SET financeiro_id = ? WHERE doacao_id = ?`, [newFinId, id]);
                        }
                    }
                    await conn.commit();
                    conn.release();
                } else {
                    await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, evento_id = ? WHERE id = ?`,
                        [data, tipo, obs, doadorId, idosoNome, eventoId ?? null, id]);
                    const [prevDoaRows] = await conn.execute(`SELECT produto_id, quantidade FROM doacaoproduto WHERE doacao_id = ? LIMIT 1`, [id]);
                    const prevProdId = Array.isArray(prevDoaRows) && prevDoaRows.length ? prevDoaRows[0].produto_id : null;
                    const prevQty = Array.isArray(prevDoaRows) && prevDoaRows.length ? Number(prevDoaRows[0].quantidade) : 0;
                    if (!prevProdId) {
                        await conn.rollback();
                        conn.release();
                        throw new Error("Produto vinculado à doação não encontrado");
                    }
                    const categoria = (doacaoData?.tipo === 'A' ? 'Alimentos' : 'Outros');
                    const unidade = (doacaoData?.doacao?.unidade_medida ?? 'Unidade');
                    const newQty = Number(doacaoData?.doacao?.qntd ?? prevQty);
                    if (!newQty || newQty <= 0) {
                        await conn.rollback();
                        conn.release();
                        throw new Error("Quantidade atualizada inválida");
                    }
                    const nomeNorm = String(item || '').trim().toLowerCase();
                    const [dupRows] = await conn.execute(`SELECT id FROM produtos WHERE nome_norm = ? AND id <> ? LIMIT 1`, [nomeNorm, prevProdId]);
                    if (Array.isArray(dupRows) && dupRows.length > 0) {
                        await conn.rollback();
                        conn.release();
                        const err = new Error("Já existe outro produto com este nome");
                        err.code = 'PRODUTO_NOME_DUPLICADO';
                        throw err;
                    }
                    await conn.execute(`UPDATE produtos SET nome = ?, categoria = ?, unidade_medida = ?, data_atualizacao = NOW() WHERE id = ?`, [item, categoria, unidade, prevProdId]);
                    await conn.execute(`UPDATE doacaoproduto SET unidade_medida = ?, quantidade = ? WHERE doacao_id = ?`, [unidade, newQty, id]);
                    const delta = newQty - prevQty;
                    if (delta !== 0) {
                        await conn.execute(`UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?`, [delta, prevProdId]);
                    }
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
                const [colChk] = await conn.query(`
                    SELECT COUNT(*) AS cnt
                    FROM information_schema.columns
                    WHERE table_schema = DATABASE()
                      AND table_name = 'doacaodinheiro'
                      AND column_name = 'financeiro_id'
                `);
                const hasFinanceiroIdCol = colChk && colChk[0] && Number(colChk[0].cnt) > 0;
                if (hasFinanceiroIdCol) {
                    const [rows] = await conn.execute(`SELECT financeiro_id FROM doacaodinheiro WHERE doacao_id = ?`, [id]);
                    finIds = (rows || []).map(r => r.financeiro_id).filter(v => v != null);
                }
            } catch {}

            // Remove registros filhos primeiro para evitar problemas de integridade referencial
            await conn.execute(`DELETE FROM doacaodinheiro WHERE doacao_id = ?`, [id]);
            await conn.execute(`DELETE FROM doacaoproduto WHERE doacao_id = ?`, [id]);

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