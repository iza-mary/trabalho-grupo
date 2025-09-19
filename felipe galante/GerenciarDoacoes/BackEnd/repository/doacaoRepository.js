const db = require("../config/database");
const Doacao = require("../models/doacao");

class DoacaoRepository {
    async findAll() {
        try {
            const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador
            , d.idoso, d.evento, 
            dd.id as dinheiroId, dd.valor, 
            dp.id as produtoId, dp.item, dp.qntd
            FROM doacoes d LEFT JOIN doacaodinheiro dd ON d.id = dd.id 
            LEFT JOIN doacaoproduto dp ON d.id = dp.id`)
            return rows.map(rows => new Doacao(rows));
        } catch (error) {
            throw new Error(`Erro ao buscar doação: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            const [rows] = await db.execute(`SELECT d.id, d.data, d.tipo, d.obs, d.doador
            , d.idoso, d.evento, 
            dd.id as dinheiroId, dd.valor, 
            dp.id as produtoId, dp.item, dp.qntd
            FROM doacoes d LEFT JOIN doacaodinheiro dd ON d.id = dd.id
            LEFT JOIN doacaoproduto dp ON d.id = dp.id
            WHERE d.id = ?`, [id]);
            if (rows.length === 0) return null;
            return new Doacao(rows[0])
        } catch (error) {
            throw new Error(`Erro ao buscar doação: ${error.message}`);
        }
    }

    async findByFiltred(tipo = "todos", data = "todos", destinatario = "todos", busca = "") {
        try {
            let where = []
            if (tipo !== "todos") {
                where.push(`tipo = "${tipo}"`);
            }

            if (data !== "todos") {
                if (data === "hoje") {
                    where.push(`DATE(data) = CURDATE()`);
                } else if (data === "semana") {
                    where.push(`YEARWEEK(data, 1) = YEARWEEK(CURDATE(), 1)`);
                } else if (data === "mes") {
                    where.push(`YEAR(data) = YEAR(CURDATE()) AND MONTH(data) = MONTH(CURDATE())`);
                } else if (data === "ano") {
                    where.push(`YEAR(data) = YEAR(CURDATE())`);
                }
            }

            if (destinatario !== "todos") {
                if (destinatario === "instituicao") {
                    where.push(`LOWER(destinatario) LIKE "%instituição%"`)
                } else if (destinatario === "idosos") {
                    where.push(`LOWER(destinatario) LIKE "quarto"`)
                }
            }

            if (busca !== "") {
                where.push(`
                    (
                    LOWER(item) LIKE "%${busca}%" OR
                    REPLACE(valorquantidade, ".", ",") LIKE "%${busca}%" OR
                    LOWER(destinatario) LIKE "%${busca}%" OR
                    LOWER(doador) LIKE "%${busca}%" OR 
                    telefone LIKE "%${busca}%" OR
                    LOWER(evento) LIKE "%${busca}%" OR
                    LOWER(obs) LIKE "%${busca}%"
                )`)
            }
            const [rows] = await db.execute(`SELECT * FROM doacoes ${where.length > 0 ? " WHERE " + where.join(" AND ") : ""}`)
            return rows.map(rows => new Doacao(rows));
        } catch (error) {
            throw new Error("Erro ao filtrar doações: " + error.message)
        }
    }

    async create(doacaoData) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const { data, tipo, obs, doador, idoso, evento } = doacaoData;
            const { item, qntd, valor } = doacaoData.doacao;
            if (tipo.toUpperCase() === "D") {
                const [result] = await conn.execute(`INSERT INTO doacoes (
                data, tipo, obs, doador, idoso, evento) VALUES ( ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doador, idoso, evento]);
                const doacaoId = result.insertId;
                await conn.execute(`INSERT INTO doacaodinheiro (id, valor) VALUES (?, ?)`, [doacaoId, valor]);
                await conn.commit();
                conn.release();
                return await this.findById(doacaoId);
            } else {
                const [result] = await conn.execute(`INSERT INTO doacoes (
                data, tipo, obs, doador, idoso, evento) VALUES ( ?, ?, ?, ?, ?, ?)`, [data, tipo, obs, doador, idoso, evento]);
                const doacaoId = result.insertId;
                await conn.execute(`INSERT INTO doacaoproduto (id, item, qntd) VALUES (?, ?, ?)`, [doacaoId, item, qntd]);
                await conn.commit();
                conn.release();
                return await this.findById(doacaoId);
            }
        } catch (error) {
            conn.rollback();
            throw new Error(`Erro ao gravar doação: ${error.message}`);
        }
    }

    async update(id, doacaoData) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const { data, tipo, obs, doador, idoso, evento } = doacaoData;
            const { item, qntd, valor } = doacaoData.doacao;
            if (tipo.toUpperCase() === "D") {
                await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, evento = ? WHERE id = ?`,
                    [data, tipo, obs, doador, idoso, evento, id]);
                await conn.execute(`UPDATE doacaodinheiro SET valor = ? WHERE id = ?`, [valor, id]);
                await conn.commit();
                conn.release();
            } else {
                await conn.execute(`UPDATE doacoes SET data = ?, tipo = ?, obs = ?, doador = ?, idoso = ?, evento = ? WHERE id = ?`,
                    [data, tipo, obs, doador, idoso, evento, id]);
                await conn.execute(`UPDATE doacaoproduto SET item = ?, qntd = ? WHERE id = ?`, [item, qntd, id]);
                await conn.commit();
                conn.release();
            }
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Erro ao atualizar doação: ${error.message}`);
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
}

module.exports = new DoacaoRepository();