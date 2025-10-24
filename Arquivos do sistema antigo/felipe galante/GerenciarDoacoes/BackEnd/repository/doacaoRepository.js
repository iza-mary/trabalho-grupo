const db = require("../config/database");
const Doacao = require("../models/doacao");

class DoacaoRepository {
    async findAll() {
        try {
            const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, d.evento, d.evento_id AS eventoId,
            dd.id as dinheiroId, dd.valor,
            dp.id as produtoId, dp.item, dp.qntd,
            e.titulo AS eventoTitulo
            FROM doacoes d
            LEFT JOIN doacaodinheiro dd ON d.id = dd.doacao_id
            LEFT JOIN doacaoproduto dp ON d.id = dp.doacao_id
            LEFT JOIN eventos e ON d.evento_id = e.id`)
            return rows.map(rows => new Doacao(rows));
        } catch (error) {
            // Fallback para bancos ainda sem coluna idoso_id
            try {
                const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.evento, d.evento_id AS eventoId,
                dd.id as dinheiroId, dd.valor,
                dp.id as produtoId, dp.item, dp.qntd,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacaodinheiro dd ON d.id = dd.doacao_id
                LEFT JOIN doacaoproduto dp ON d.id = dp.doacao_id
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
            d.idoso, d.idoso_id, i.nome as idosoNome, d.evento, d.evento_id AS eventoId,
            dd.id as dinheiroId, dd.valor,
            dp.id as produtoId, dp.item, dp.qntd,
            e.titulo AS eventoTitulo
            FROM doacoes d 
            LEFT JOIN idosos i ON d.idoso_id = i.id
            LEFT JOIN doacaodinheiro dd ON d.id = dd.doacao_id
            LEFT JOIN doacaoproduto dp ON d.id = dp.doacao_id
            LEFT JOIN eventos e ON d.evento_id = e.id
            WHERE d.id = ?`, [id]);
            if (rows.length === 0) return null;
            return new Doacao(rows[0])
        } catch (error) {
            // Fallback para bancos ainda sem coluna idoso_id
            try {
                const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.idoso as idosoNome, d.evento, d.evento_id AS eventoId,
                dd.id as dinheiroId, dd.valor,
                dp.id as produtoId, dp.item, dp.qntd,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacaodinheiro dd ON d.id = dd.doacao_id
                LEFT JOIN doacaoproduto dp ON d.id = dp.doacao_id
                LEFT JOIN eventos e ON d.evento_id = e.id
                WHERE d.id = ?`, [id]);
                if (rows.length === 0) return null;
                return new Doacao(rows[0]);
            } catch (fallbackErr) {
                throw new Error(`Erro ao buscar doação: ${fallbackErr.message}`);
            }
        }
    }

    async findByFiltred(tipo = "todos", data = "todos", destinatario = "todos", busca = "", eventoId = undefined) {
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
                    LOWER(dp.item) LIKE ? OR
                    CAST(dp.qntd AS CHAR) LIKE ? OR
                    CAST(dd.valor AS CHAR) LIKE ? OR
                    LOWER(d.idoso) LIKE ? OR
                    LOWER(d.evento) LIKE ? OR
                    LOWER(d.obs) LIKE ?
                )`);
                params.push(buscaParam, buscaParam, buscaParam, buscaParam, buscaParam, buscaParam);
            }

            if (eventoId && !isNaN(Number(eventoId))) {
                where.push("(d.evento_id = ? OR LOWER(d.evento) IN (SELECT LOWER(titulo) FROM eventos WHERE id = ?))");
                params.push(Number(eventoId), Number(eventoId));
            }

            const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
            d.idoso, d.idoso_id, d.evento, d.evento_id AS eventoId,
            dd.id as dinheiroId, dd.valor,
            dp.id as produtoId, dp.item, dp.qntd,
            e.titulo AS eventoTitulo
            FROM doacoes d
            LEFT JOIN doacaodinheiro dd ON d.id = dd.doacao_id
            LEFT JOIN doacaoproduto dp ON d.id = dp.doacao_id
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
                        LOWER(dp.item) LIKE ? OR
                        CAST(dp.qntd AS CHAR) LIKE ? OR
                        CAST(dd.valor AS CHAR) LIKE ? OR
                        LOWER(d.idoso) LIKE ? OR
                        LOWER(d.evento) LIKE ? OR
                        LOWER(d.obs) LIKE ?
                    )`);
                    params.push(buscaParam, buscaParam, buscaParam, buscaParam, buscaParam, buscaParam);
                }

                const sql = `SELECT d.id, d.data, d.tipo, d.obs, d.doador,
                d.idoso, NULL as idoso_id, d.evento, d.evento_id AS eventoId,
                dd.id as dinheiroId, dd.valor,
                dp.id as produtoId, dp.item, dp.qntd,
                e.titulo AS eventoTitulo
                FROM doacoes d
                LEFT JOIN doacaodinheiro dd ON d.id = dd.doacao_id
                LEFT JOIN doacaoproduto dp ON d.id = dp.doacao_id
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
                data, tipo, obs, doador, idoso, idoso_id, evento, evento_id) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doadorId, idosoNome, idosoId, evento ?? null, eventoId ?? null]);
                const doacaoId = result.insertId;
                await conn.execute(`INSERT INTO doacaodinheiro (doacao_id, valor) VALUES (?, ?)`, [doacaoId, valor]);
                await conn.commit();
                conn.release();
                return await this.findById(doacaoId);
            } else {
                const [result] = await conn.execute(`INSERT INTO doacoes (
                data, tipo, obs, doador, idoso, idoso_id, evento, evento_id) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doadorId, idosoNome, idosoId, evento ?? null, eventoId ?? null]);
                const doacaoId = result.insertId;
                await conn.execute(`INSERT INTO doacaoproduto (doacao_id, item, qntd) VALUES (?, ?, ?)`, [doacaoId, item, qntd]);
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
                    data, tipo, obs, doador, idoso, evento, evento_id) VALUES ( ?, ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doadorId, idosoNome, evento ?? null, eventoId ?? null]);
                    const doacaoId = result.insertId;
                    await conn.execute(`INSERT INTO doacaodinheiro (doacao_id, valor) VALUES (?, ?)`, [doacaoId, valor]);
                    await conn.commit();
                    conn.release();
                    return await this.findById(doacaoId);
                } else {
                    const [result] = await conn.execute(`INSERT INTO doacoes (
                    data, tipo, obs, doador, idoso, evento, evento_id) VALUES ( ?, ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doadorId, idosoNome, evento ?? null, eventoId ?? null]);
                    const doacaoId = result.insertId;
                    await conn.execute(`INSERT INTO doacaoproduto (doacao_id, item, qntd) VALUES (?, ?, ?)`, [doacaoId, item, qntd]);
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
                await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, idoso_id = ?, evento = ?, evento_id = ? WHERE id = ?`,
                    [data, tipo, obs, doadorId, idosoNome, idosoId, evento ?? null, eventoId ?? null, id]);
                await conn.execute(`UPDATE doacaodinheiro SET valor = ? WHERE doacao_id = ?`, [valor, id]);
                await conn.commit();
                conn.release();
            } else {
                await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, idoso_id = ?, evento = ?, evento_id = ? WHERE id = ?`,
                    [data, tipo, obs, doadorId, idosoNome, idosoId, evento ?? null, eventoId ?? null, id]);
                await conn.execute(`UPDATE doacaoproduto SET item = ?, qntd = ? WHERE doacao_id = ?`, [item, qntd, id]);
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
                const {doadorId} = doacaoData.doador
                const idosoNome = doacaoData.idoso?.nome || doacaoData.idoso || null;
                if (tipo.toUpperCase() === "D") {
                    await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, evento = ?, evento_id = ? WHERE id = ?`,
                        [data, tipo, obs, doadorId, idosoNome, evento ?? null, eventoId ?? null, id]);
                    await conn.execute(`UPDATE doacaodinheiro SET valor = ? WHERE doacao_id = ?`, [valor, id]);
                    await conn.commit();
                    conn.release();
                } else {
                    await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, evento = ?, evento_id = ? WHERE id = ?`,
                        [data, tipo, obs, doadorId, idosoNome, evento ?? null, eventoId ?? null, id]);
                    await conn.execute(`UPDATE doacaoproduto SET item = ?, qntd = ? WHERE doacao_id = ?`, [item, qntd, id]);
                    await conn.commit();
                    conn.release();
                }
                return await this.findById(id);
            } catch (fallbackErr) {
                throw new Error(`Erro ao atualizar doação: ${fallbackErr.message}`);
            }
        }
    }

    async delete(id) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const [result] = await db.execute(`DELETE FROM doacoes WHERE id = ?`, [id]);
            await conn.commit();
            conn.release();
            return result.affectedRows > 0
        } catch (error) {
            throw new Error(`Erro ao deletar doação: ${error.message}`);
        }
    }

    async getDoadorByName(nome) {
        try {
            const [rows] = await db.execute("SELECT id, nome FROM doadores WHERE nome LIKE ?", [`%${nome}%`]);
            if (rows.length === 0) return [];
            return rows;
        } catch (error) {
            throw new Error("Erro ao buscar doador: " + error.message);
        }
    }
}

module.exports = new DoacaoRepository();