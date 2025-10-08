const db = require('../config/database');

class QuartoRepository {
    async findAll() {
        try {
            const [rows] = await db.query('SELECT * FROM quartos ORDER BY numero');
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar quartos: ${error.message}`);
        }
    }

    async findById(id) {
        try {
            const [rows] = await db.execute('SELECT * FROM quartos WHERE id = ?', [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Erro ao buscar quarto: ${error.message}`);
        }
    }

    async findByNumero(numero) {
        try {
            const [rows] = await db.execute('SELECT * FROM quartos WHERE numero = ?', [numero]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            throw new Error(`Erro ao buscar quarto por número: ${error.message}`);
        }
    }

    async create(quartoData) {
        try {
            const { numero, capacidade, descricao } = quartoData;
            
            // Verifica se já existe quarto com esse número
            const quartoExistente = await this.findByNumero(numero);
            if (quartoExistente) {
                throw new Error('Já existe um quarto com este número');
            }

            const [result] = await db.execute(
                'INSERT INTO quartos (numero, capacidade, descricao) VALUES (?, ?, ?)',
                [numero, capacidade, descricao]
            );
            return await this.findById(result.insertId);
        } catch (error) {
            throw new Error(`Erro ao criar quarto: ${error.message}`);
        }
    }

    async update(id, quartoData) {
        try {
            const { numero, capacidade, descricao, status } = quartoData;
            
            // Verifica se o novo número já existe em outro quarto
            if (numero) {
                const [existing] = await db.execute(
                    'SELECT id FROM quartos WHERE numero = ? AND id != ?',
                    [numero, id]
                );
                if (existing.length > 0) {
                    throw new Error('Já existe outro quarto com este número');
                }
            }

            const [result] = await db.execute(
                'UPDATE quartos SET numero = ?, capacidade = ?, descricao = ?, status = ? WHERE id = ?',
                [numero, capacidade, descricao, status, id]
            );
            return result.affectedRows > 0 ? await this.findById(id) : null;
        } catch (error) {
            throw new Error(`Erro ao atualizar quarto: ${error.message}`);
        }
    }

    async delete(id) {
        try {
            // Verifica se o quarto está em uso
            const [internacoes] = await db.execute(
                'SELECT id FROM internacoes WHERE quarto_id = ? AND status = "ativa"',
                [id]
            );
            
            if (internacoes.length > 0) {
                throw new Error('Não é possível excluir um quarto com internações ativas');
            }

            const [result] = await db.execute('DELETE FROM quartos WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Erro ao excluir quarto: ${error.message}`);
        }
    }

    async getDisponiveis() {
        try {
            const [rows] = await db.execute(`
                SELECT q.*,
                       COALESCE(COUNT(i.id), 0) AS ocupadas
                FROM quartos q
                LEFT JOIN internacoes i 
                  ON i.quarto_id = q.id 
                 AND i.status = 'ativa'
                GROUP BY q.id
                HAVING q.capacidade > COALESCE(COUNT(i.id), 0)
                ORDER BY q.numero
            `);
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar quartos disponíveis: ${error.message}`);
        }
    }

    // Busca por número ou descrição, com filtro opcional de status
    async search(search, status) {
        try {
            let sql = 'SELECT * FROM quartos';
            const conditions = [];
            const params = [];

            if (search && String(search).trim() !== '') {
                conditions.push('(CAST(numero AS CHAR) LIKE ? OR descricao LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            if (status && String(status).trim() !== '') {
                if (status === 'disponivel') {
                    conditions.push('status IN (?, ?)');
                    params.push('disponivel', 'ativo');
                } else {
                    conditions.push('status = ?');
                    params.push(status);
                }
            }

            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }

            sql += ' ORDER BY numero';

            const [rows] = await db.execute(sql, params);
            return rows;
        } catch (error) {
            throw new Error(`Erro ao buscar quartos por termo: ${error.message}`);
        }
    }
}

module.exports = new QuartoRepository();