const db = require("../config/database")
const Doador = require("../models/doador")

class DoadorRepository {
    async findAll() {
        try {
            const [rows] = await db.execute('SELECT * FROM doadores ORDER BY nome')
            return rows.map(rows => new Doador(rows))
        } catch (error) {
            throw new Error("Erro ao buscar doadores:" + error.message);
        }
    }

    async findById(id) {
        try {
            const [rows] = await db.execute("SELECT * FROM doadores WHERE id = ?", [id]);
            if (rows.length === 0) return null;
            return new Doador(rows[0]);
        } catch (error) {
            throw new Error("Erro ao buscar doador: " + error.message);
        }
    }

    async create(doadorData) {
        try {
            const { nome, cpf, cnpj, telefone, rg, email, cidade, rua, numero, cep, complemento } = doadorData;
            const [result] = await db.execute('INSERT INTO doadores (nome, cpf, cnpj, telefone, rg, email, cidade, rua, numero, cep, complemento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [nome, cpf, cnpj, telefone, rg, email, cidade, rua, numero, cep, complemento]
            )
            return await this.findById(result.insertId)
        } catch (error) {
            throw new Error("Erro ao gravar doador:" + error.message);
        }
    }

    async update(id, doadorData) {
        try {
            const { nome, cpf, cnpj, telefone, rg, email, cidade, rua, numero, cep, complemento } = doadorData;
            const [result] = await db.execute("UPDATE doadores SET nome = ?, cpf = ?, cnpj = ?, telefone = ?, rg = ?, email = ?, cidade = ?, rua = ?, numero = ?, cep = ?, complemento = ? WHERE id = ?", [nome, cpf, cnpj, telefone, rg, email, cidade, rua, numero, cep, complemento, id])
            return await this.findById(id);
        } catch (error) {
            throw new Error("Erro ao atualizar doador: " + error.message);
        }
    }

    async delete(id) {
        try {
            const [result] = await db.execute("DELETE FROM doadores WHERE id = ?", [id]);
            return result.affectedRows > 0
        } catch (error) {
            throw new Error("Erro ao deletar doador:" + error.message);
        }
    }

    async getByBusca(filtros) {
        try {
            const colunas = ["nome", "cpf", "cnpj", "telefone", "rg", "email", "cidade", "rua", "numero", "cep", "complemento"];
            const whereConditions = [];
            const whereValues = [];
            const relevanceParts = [];
            const relevanceValues = [];

            if (filtros.length === 0) {
                const [rows] = await db.execute(`SELECT * FROM doadores ORDER BY nome`);
                return rows.map(rows => new Doador(rows));
            }

            filtros.forEach((termo) => {
                const grupoCondicoes = colunas.map(coluna => `${coluna} LIKE ?`).join(" OR ")
                whereConditions.push(`(${grupoCondicoes})`);

                colunas.forEach(() => {
                    whereValues.push(`%${termo}%`)
                });

                colunas.forEach((coluna) => {
                    relevanceParts.push(`CASE WHEN ${coluna} LIKE ? THEN 1 ELSE 0 END`);
                    relevanceValues.push(`%${termo}%`)
                });
            });

            const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(" OR ")}` : "";
            const relevanceClause = relevanceParts.length ? `${relevanceParts.join(" + ")} AS relevance` : `0 AS relevance`;
            
            const query = `SELECT *, ${relevanceClause} FROM doadores ${whereClause} ORDER BY relevance DESC`;

            const values = [...whereValues, ...relevanceValues];

            const [rows] = await db.execute(query, values);
            return rows.map(rows => new Doador(rows))
        } catch (error) {
            throw new Error("Erro ao buscar doadores: " + error.message);
        }
    }
}

module.exports = new DoadorRepository();