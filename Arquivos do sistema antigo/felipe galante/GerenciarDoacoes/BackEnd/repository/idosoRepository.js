const db = require("../config/database");

class IdosoRepository {
    async findAll() {
        try {
            const [rows] = await db.execute(
                "SELECT id, nome FROM idosos ORDER BY nome ASC"
            );
            return rows;
        } catch (error) {
            throw new Error("Erro ao buscar idosos: " + error.message);
        }
    }

    async findByNome(nome) {
        try {
            const [rows] = await db.execute(
                "SELECT id, nome FROM idosos WHERE nome LIKE ? ORDER BY nome ASC",
                [`%${nome}%`]
            );
            return rows;
        } catch (error) {
            throw new Error("Erro ao buscar idosos por nome: " + error.message);
        }
    }
}

module.exports = new IdosoRepository();