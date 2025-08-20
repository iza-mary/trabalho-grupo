// Arquivo Temporário

const db = require("../config/database")

class DoacaoRepository {
    async createDoacao(idDoador, doacaoNome, qntd) {
        const conection = await db.getConnection();
        try {
            await conection.beginTransaction();
            const doador = await conection.query("SELECT * FROM doadores WHERE id = ?", [idDoador]);
            if(!doador) {
                const e = new Error("Doador não encontrado");
                e.status = 404;
                throw e;
            }
            const [result] = await conection.query("INSERT INTO doacoes (doador_id, doacaoNome, qntd) VALUES (?, ?, ?)", [idDoador, doacaoNome, qntd]);

            await conection.commit();

            const [rows] = await conection.query("SELECT * FROM doacoes WHERE id = ?", [result.insertId]);
            return rows[0];

        } catch (error) {
            conection.rollback();
            throw new Error("Erro ao criar doação: " + error.message);
        }
    }

    async findAllDoadorComDoacao() {
        try {
            const [rows] = await db.execute(`SELECT dc.id, dc.doacaoNome, dc.qntd,dc.doador_id, dd.nome, dd.cpf FROM doacoes dc JOIN doadores dd ON dd.id = dc.doador_id`)
            
            if (rows.length === 0) return [];
            return rows.map(rows => ({
                id: rows.id,
                doacaoNome: rows.doacaoNome,
                qntd: rows.qntd,
                doador: {
                    id: rows.doador_id,
                    nome: rows.nome,
                    cpf: rows.cpf
                }
            }))
        } catch (error) {
            throw new Error("Erro ao buscar doadores com doação: " + error.message);
        }
    }
}

module.exports = new DoacaoRepository();