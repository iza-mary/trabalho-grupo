const db = require('../config/database.js');

class ObservacaoRepository {

    async findByIdoso(idosoId) {
        const conn = await db.getConnection();
        try {
            const [rows] = await conn.execute(
                'SELECT o.*, u.username as usuario_nome FROM observacoes_idosos o LEFT JOIN users u ON o.usuario_id = u.id WHERE o.idoso_id = ? ORDER BY o.data_registro DESC',
                [idosoId]
            );
            return rows;
        } finally {
            if (conn) conn.release();
        }
    }

    async create(idosoId, usuarioId, observacao) {
        const conn = await db.getConnection();
        try {
            const [result] = await conn.execute(
                'INSERT INTO observacoes_idosos (idoso_id, usuario_id, observacao) VALUES (?, ?, ?)',
                [idosoId, usuarioId, observacao]
            );
            const [rows] = await conn.execute('SELECT * FROM observacoes_idosos WHERE id = ?', [result.insertId]);
            return rows[0];
        } finally {
            if (conn) conn.release();
        }
    }

    async update(obsId, idosoId, observacao) {
        const conn = await db.getConnection();
        try {
            await conn.execute(
                'UPDATE observacoes_idosos SET observacao = ? WHERE id = ? AND idoso_id = ?',
                [observacao, obsId, idosoId]
            );
            const [rows] = await conn.execute('SELECT * FROM observacoes_idosos WHERE id = ?', [obsId]);
            return rows[0];
        } finally {
            if (conn) conn.release();
        }
    }

    async delete(obsId, idosoId) {
        const conn = await db.getConnection();
        try {
            const [result] = await conn.execute(
                'DELETE FROM observacoes_idosos WHERE id = ? AND idoso_id = ?',
                [obsId, idosoId]
            );
            return result.affectedRows > 0;
        } finally {
            if (conn) conn.release();
        }
    }

    async findById(obsId, idosoId) {
        const conn = await db.getConnection();
        try {
            const [rows] = await conn.execute(
                'SELECT id FROM observacoes_idosos WHERE id = ? AND idoso_id = ?',
                [obsId, idosoId]
            );
            return rows[0];
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = new ObservacaoRepository();
