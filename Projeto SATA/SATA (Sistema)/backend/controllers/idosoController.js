const db = require('../config/database.js');
const Idoso = require('../models/idoso');
const IdosoRepository = require('../repository/idosoRepository.js');
const notificacaoController = require('./notificacaoController'); // Importar o controlador de notificações
const normalizeRG = (v) => String(v || '').replace(/\D/g, '');

const { getCamaNome } = require('../utils/formatters');

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
            const [estado] = await db.execute('SELECT id FROM estados WHERE nome = ? OR uf = ?', [req.body.estado, req.body.estado]);
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

            // Criar notificação
            try {
              const notificacaoData = {
                tipo: 'cadastro',
                titulo: 'Novo Idoso Cadastrado',
                descricao: `O idoso ${newIdoso.nome} foi cadastrado no sistema.`,
                referencia_id: newIdoso.id,
                referencia_tipo: 'idoso',
                usuario_id: req.user ? req.user.id : null
              };
              await notificacaoController.criarNotificacao(notificacaoData);
            } catch (notificacaoError) {
              console.error('Erro ao criar notificação de cadastro de idoso:', notificacaoError.message);
              // Não bloquear a resposta principal por falha na notificação
            }
            
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
            const [estado] = await db.execute('SELECT id FROM estados WHERE nome = ? OR uf = ?', [req.body.estado, req.body.estado]);
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

            // Criar notificação
            try {
              const notificacaoData = {
                tipo: 'cadastro', // Usando 'cadastro' para abranger atualizações
                titulo: 'Idoso Atualizado',
                descricao: `Os dados do idoso ${updated.nome} foram atualizados.`,
                referencia_id: updated.id,
                referencia_tipo: 'idoso',
                usuario_id: req.user ? req.user.id : null
              };
              await notificacaoController.criarNotificacao(notificacaoData);
            } catch (notificacaoError) {
              console.error('Erro ao criar notificação de atualização de idoso:', notificacaoError.message);
            }
            
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

    // Ficha completa do idoso (dados agregados para visualização/impressão)
    async getFichaCompleta(req, res) {
        try {
            const { id } = req.params;

            // Buscar idoso
            const idoso = await IdosoRepository.findById(id);
            if (!idoso) {
                return res.status(404).json({ success: false, message: 'Idoso não encontrado' });
            }

            // Nome do estado
            let estadoNome = null;
            try {
                const [estadoRows] = await db.execute('SELECT nome FROM estados WHERE id = ?', [idoso.estadoId]);
                estadoNome = Array.isArray(estadoRows) && estadoRows[0] ? estadoRows[0].nome : null;
            } catch {}

            // Internações e acomodação
            const InternacaoRepository = require('../repository/internacaoRepository');
            let internacoes = [];
            try {
                internacoes = await InternacaoRepository.findByUsuarioId(id);
            } catch (e) {
                console.warn('Falha ao buscar internações do idoso na ficha completa:', e.message);
                internacoes = [];
            }

            const historicoQuartos = (internacoes || []).map((i) => ({
                quartoNumero: i.quarto_numero || i.quarto_id || null,
                cama: getCamaNome(i.cama) || null,
                dataEntrada: i.data_entrada || null,
                dataSaida: i.data_saida || null,
                status: i.status || null,
            }));
            const atual = (internacoes || []).find(i => String(i.status).toLowerCase() === 'ativa') || null;

            // Histórico de observações
            let observacoes = [];
            try {
                const [obsRows] = await db.execute(
                    `SELECT o.*, u.username as usuario_nome 
                     FROM observacoes_idosos o 
                     LEFT JOIN users u ON o.usuario_id = u.id 
                     WHERE o.idoso_id = ? 
                     ORDER BY o.data_registro DESC`,
                    [id]
                );
                observacoes = obsRows;
            } catch (e) {
                console.warn('Falha ao buscar observações do idoso na ficha completa:', e.message);
            }

            // Utilitário para idade
            const calcIdade = (dob) => {
                if (!dob) return null;
                const nascimento = new Date(dob);
                const hoje = new Date();
                let idade = hoje.getFullYear() - nascimento.getFullYear();
                const m = hoje.getMonth() - nascimento.getMonth();
                if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
                return idade;
            };

            const ficha = {
                dadosPessoais: {
                    nome: idoso.nome,
                    dataNascimento: idoso.dataNascimento,
                    idade: calcIdade(idoso.dataNascimento),
                    contatos: {
                        telefone: idoso.telefone || null,
                        email: idoso.email || null,
                        responsavel: idoso.responsavel || null,
                    },
                    documentos: {
                        rg: idoso.rg || null,
                        cpf: idoso.cpf || null,
                        cartaoSus: idoso.cartaoSus || null,
                    },
                    endereco: {
                        rua: idoso.rua || null,
                        numero: idoso.numero || null,
                        complemento: idoso.complemento || null,
                        cidade: idoso.cidade || null,
                        estado: estadoNome,
                        cep: idoso.cep || null,
                    },
                },
                acomodacao: {
                    atual: atual ? {
                        quartoNumero: atual.quarto_numero || atual.quarto_id || null,
                        cama: getCamaNome(atual.cama) || null,
                        dataEntrada: atual.data_entrada || null,
                    } : null,
                    historico: historicoQuartos,
                },
                medica: {
                    diagnosticos: [], // Sem repositório de diagnósticos identificado
                    alergias: [], // Sem repositório de alergias identificado
                    internacoes: historicoQuartos,
                },
                medicamentos: {
                    emUso: [], // Sem repositório de medicamentos identificado
                    prescricoesAtivas: [], // Sem repositório de prescrições identificado
                },
                observacoes: {
                    historico: observacoes,
                    status: idoso.status || null,
                },
            };

            return res.json({ success: true, data: ficha });
        } catch (error) {
            console.error('Erro em getFichaCompleta:', error);
            return res.status(500).json({ success: false, message: error.message });
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
        
        // Atualizar status do idoso
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

        // Se a ação foi baixa (nao_internado), finalizar internações ativas
        let resumoBaixa = null;
        if (status === 'nao_internado') {
            try {
                const InternacaoRepository = require('../repository/internacaoRepository');
                resumoBaixa = await InternacaoRepository.finalizarPorIdoso(id, 'Baixa realizada via cadastro de idosos');
            } catch (e) {
                console.error('Falha ao finalizar internações ativas durante updateStatus:', e.message);
            }
        }

        // Buscar o idoso atualizado
        const [rows] = await db.execute('SELECT * FROM idosos WHERE id = ?', [id]);
        const idosoAtualizado = new Idoso(rows[0]);

        // Log estruturado para auditoria
        try {
            const ts = new Date().toISOString();
            console.log(JSON.stringify({
                scope: 'idosos',
                operation: 'update_status',
                timestamp: ts,
                idoso_id: Number(id),
                novo_status: status,
                baixa_aplicada: status === 'nao_internado',
                resumo_baixa: resumoBaixa
            }));
        } catch {}

        res.json({
            success: true,
            data: idosoAtualizado.toJSON(),
            message: 'Status atualizado com sucesso',
            resumoBaixa
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

            // Criar notificação de exclusão
            if (ok) {
              try {
                const notificacaoData = {
                  tipo: 'cadastro', // Usando 'cadastro' para abranger exclusões
                  titulo: 'Idoso Excluído',
                  descricao: `O idoso ${idoso.nome} (ID: ${id}) foi excluído do sistema.`,
                  referencia_tipo: 'idoso',
                  usuario_id: req.user ? req.user.id : null
                };
                await notificacaoController.criarNotificacao(notificacaoData);
              } catch (notificacaoError) {
                console.error('Erro ao criar notificação de exclusão de idoso:', notificacaoError.message);
              }
            }

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

  async addObservacao(req, res) {
    const conn = await db.getConnection();
    try {
      const { id } = req.params;
      const { observacao, usuario_id } = req.body;

            if (!observacao || observacao.trim() === '') {
                return res.status(400).json({ success: false, message: 'A observação não pode estar vazia.' });
            }

            const [result] = await conn.execute(
                'INSERT INTO observacoes_idosos (idoso_id, usuario_id, observacao) VALUES (?, ?, ?)',
                [id, usuario_id, observacao]
            );

            const [rows] = await conn.execute('SELECT * FROM observacoes_idosos WHERE id = ?', [result.insertId]);

            conn.release();

      res.status(201).json({ success: true, data: rows[0] });
    } catch (error) {
      try { conn.release(); } catch {}
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async listObservacoes(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await db.execute('SELECT id, idoso_id, usuario_id, observacao, data_registro FROM observacoes_idosos WHERE idoso_id = ? ORDER BY data_registro DESC, id DESC', [id]);
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateObservacao(req, res) {
    const conn = await db.getConnection();
    try {
      const { id, obsId } = req.params;
      const { observacao } = req.body;
      if (!observacao || observacao.trim() === '') {
        conn.release();
        return res.status(400).json({ success: false, message: 'A observação não pode estar vazia.' });
      }
      const [rows] = await conn.execute('SELECT id FROM observacoes_idosos WHERE id = ? AND idoso_id = ?', [obsId, id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        conn.release();
        return res.status(404).json({ success: false, message: 'Observação não encontrada.' });
      }
      await conn.execute('UPDATE observacoes_idosos SET observacao = ? WHERE id = ?', [observacao, obsId]);
      const [updated] = await conn.execute('SELECT id, idoso_id, usuario_id, observacao, data_registro FROM observacoes_idosos WHERE id = ?', [obsId]);
      conn.release();
      res.json({ success: true, data: updated[0] });
    } catch (error) {
      try { conn.release(); } catch {}
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteObservacao(req, res) {
    const conn = await db.getConnection();
    try {
      const { id, obsId } = req.params;
      const [rows] = await conn.execute('SELECT id FROM observacoes_idosos WHERE id = ? AND idoso_id = ?', [obsId, id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        conn.release();
        return res.status(404).json({ success: false, message: 'Observação não encontrada.' });
      }
      await conn.execute('DELETE FROM observacoes_idosos WHERE id = ?', [obsId]);
      conn.release();
      res.json({ success: true });
    } catch (error) {
      try { conn.release(); } catch {}
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new IdosoController();
/*
  Controlador de Idosos
  - Cadastro, listagem e atualização de residentes.
*/
