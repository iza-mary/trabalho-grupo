const db = require('../config/database.js');
const Idoso = require('../models/idoso');
const IdosoRepository = require('../repository/idosoRepository.js');
const normalizeRG = (v) => String(v || '').replace(/\D/g, '');

class IdosoController {
    // Obtém todos os idosos
    async getAll(req, res) {
        try {
            // Busca todos os idosos no repositório
            const idosos = await IdosoRepository.findAll();
            
            // Prepara a resposta
            const response = {
                success: true,
                data: idosos.map(ido => ido.toJSON ? ido.toJSON() : ido)
            };
            
            // Envia a resposta
            res.json(response);
        } catch (error) {
            console.error('Erro no Controller:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao recuperar dados dos idosos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Cria um novo idoso
    async create(req, res) {
        try {
            // Verifica se o estado existe
            const [estado] = await db.execute('SELECT id FROM estados WHERE nome = ?', [req.body.estado]);
            if (!estado || estado.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido'
                });
            }

            // Prepara os dados do idoso
            const idosoData = {
                ...req.body,
                rg: normalizeRG(req.body?.rg),
                estadoId: estado[0].id
            };
            
            // Cria e valida a instância do idoso
            const idoso = new Idoso(idosoData);
            const errors = idoso.validate();
            
            // Se houver erros de validação, retorna 400
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors
                });
            }

            // Cria o idoso no banco de dados
            const newIdoso = await IdosoRepository.create(idoso);
            
            // Retorna resposta de sucesso
            res.status(201).json({
                success: true,
                data: newIdoso.toJSON(),
                message: 'Idoso criado com sucesso',
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Obtém um idoso por ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            
            // Busca o idoso no repositório
            const idoso = await IdosoRepository.findById(id);
            
            // Se não encontrar, retorna 404
            if (!idoso) {
                return res.status(404).json({
                    success: false,
                    message: 'Idoso não encontrado'
                });
            }
            
            // Busca o nome do estado
            const [estado] = await db.execute('SELECT nome FROM estados WHERE id = ?', [idoso.estadoId]);
            
            // Prepara os dados para resposta
            const responseData = {
                ...idoso.toJSON(),
                estado: estado[0].nome,
                rua: idoso.rua,
                numero: idoso.numero,
                complemento: idoso.complemento,
                cidade: idoso.cidade,
                cep: idoso.cep
            };

            console.log('Dados enviados para o frontend:', responseData);
            
            // Retorna o idoso encontrado
            res.json({
                success: true,
                data: responseData
            });
        } catch (error) {
            console.error('Erro no getById:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Atualiza um idoso existente
    async update(req, res) {
        try {
            // Verifica se o estado existe
            const [estado] = await db.execute('SELECT id FROM estados WHERE nome = ?', [req.body.estado]);
            if (!estado || estado.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido'
                });
            }

            // Prepara os dados para atualização
            const idosoData = {
                ...req.body,
                rg: normalizeRG(req.body?.rg),
                estadoId: estado[0].id,
                id: req.params.id
            };
            
            // Cria e valida a instância do idoso
            const idoso = new Idoso(idosoData);
            const errors = idoso.validate();
            
            // Se houver erros de validação, retorna 400
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados inválidos',
                    errors
                });
            }

            // Atualiza o idoso no banco de dados
            const updated = await IdosoRepository.update(req.params.id, idoso);
            
            // Se não encontrar o idoso para atualizar, retorna 404
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'Idoso não encontrado'
                });
            }

            // Retorna resposta de sucesso
            res.json({
                success: true,
                data: {
                    ...updated.toJSON(),
                    estado: req.body.estado
                },
                message: 'Idoso atualizado com sucesso'
            });
        } catch (error) {
            console.error("Erro no controller:", error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Adicione este método ao IdosoController
async updateStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validação do status
        if (!['internado', 'nao_internado'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido. Use "internado" ou "nao_internado"'
            });
        }
        
        // Atualizar apenas o status
        const [result] = await db.execute(
            'UPDATE idosos SET status = ?, data_atualizacao = NOW() WHERE id = ?',
            [status, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Idoso não encontrado'
            });
        }
        
        // Buscar o idoso atualizado
        const [rows] = await db.execute('SELECT * FROM idosos WHERE id = ?', [id]);
        const idosoAtualizado = new Idoso(rows[0]);
        
        res.json({
            success: true,
            data: idosoAtualizado.toJSON(),
            message: 'Status atualizado com sucesso'
        });
    } catch (error) {
        console.error("Erro no updateStatus:", error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

    // Remove um idoso
    async delete(req, res) {
        const conn = await db.getConnection();
        try {
            const { id } = req.params;

            // Verifica se o idoso existe
            const idoso = await IdosoRepository.findById(id);
            if (!idoso) {
                conn.release();
                return res.status(404).json({ success: false, message: 'Idoso não encontrado' });
            }

            // Checa se há internação ativa
            const [ativasRows] = await conn.execute('SELECT COUNT(*) AS cnt FROM internacoes WHERE idoso_id = ? AND status = "ativa"', [id]);
            const ativas = Array.isArray(ativasRows) && ativasRows[0] ? Number(ativasRows[0].cnt) : 0;
            if (ativas > 0) {
                conn.release();
                return res.status(409).json({ success: false, message: 'Não é possível excluir: existe internação ativa para este idoso.' });
            }

            // Conta internações totais (para log)
            const [totRows] = await conn.execute('SELECT COUNT(*) AS cnt FROM internacoes WHERE idoso_id = ?', [id]);
            const totalInternacoes = Array.isArray(totRows) && totRows[0] ? Number(totRows[0].cnt) : 0;

            await conn.beginTransaction();

            // Remove todas internações (finalizadas ou quaisquer) do idoso
            await conn.execute('DELETE FROM internacoes WHERE idoso_id = ?', [id]);

            // Desvincula doações do idoso (proteger dados: remove nome textual também)
            await conn.execute('UPDATE doacoes SET idoso_id = NULL, idoso = NULL WHERE idoso_id = ?', [id]);

            // Deleta o idoso
            const [delRes] = await conn.execute('DELETE FROM idosos WHERE id = ?', [id]);
            const ok = delRes && delRes.affectedRows > 0;

            await conn.commit();
            conn.release();

            // Log de auditoria
            try {
                const { logDeletion } = require('../utils/auditLogger');
                const actor = req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null;
                logDeletion({ entity: 'idoso', entityId: Number(id), actor, details: { internacoesRemovidas: totalInternacoes } });
            } catch {}

            if (ok) {
                return res.json({ success: true, message: 'Idoso excluído com sucesso' });
            }
            return res.status(404).json({ success: false, message: 'Idoso não encontrado' });
        } catch (error) {
            try { await conn.rollback(); } catch {}
            try { conn.release(); } catch {}
            const msg = String(error?.message || '');
            if (msg.includes('foreign key constraint fails') || msg.includes('ER_ROW_IS_REFERENCED')) {
                return res.status(409).json({ success: false, message: 'Não é possível excluir: registros relacionados impedem a deleção.' });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new IdosoController();