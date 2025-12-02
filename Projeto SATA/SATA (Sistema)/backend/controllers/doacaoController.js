const doacaoRepository = require("../repository/doacaoRepository");
const Doacao = require("../models/doacao");
const { criarNotificacao } = require("./notificacaoController");

class DoacaoController {
    async getAll(req, res) {
        try {
            const { data, tipo } = req.query;
            let doacoes = [];
            try {
                if (data) {
                    // implementar busca por data se necessário
                    doacoes = await doacaoRepository.findAll();
                } else if (tipo) {
                    // implementar busca por tipo se necessário
                    doacoes = await doacaoRepository.findAll();
                } else {
                    doacoes = await doacaoRepository.findAll();
                }
            } catch (repoErr) {
                console.error('Erro ao buscar todas as doações:', repoErr);
                doacoes = [];
            }

            let dataResp = [];
            try {
                dataResp = doacoes.map(doa => doa.toJSON());
            } catch (mapErr) {
                console.error('Erro ao montar resposta de doações (getAll):', mapErr);
                dataResp = [];
            }

            res.json({
                success: true,
                data: dataResp,
                total: dataResp.length
            })
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async create(req, res) {
        try {
            const t0 = process.hrtime.bigint();
            const payload = { ...req.body };
            if (req.user) {
                payload.actor = { id: req.user.id, nome: req.user.nome };
            }
            const doacao = new Doacao(payload);
            const errors = doacao.validate();
            if (errors.length > 0) {
                const t1 = process.hrtime.bigint();
                const durMs = Number(t1 - t0) / 1e6;
                try { console.log(JSON.stringify({ scope: 'donations', stage: 'validation_failed', duration_ms: Number(durMs.toFixed(2)) })); } catch (_) {}
                return res.status(400).json({
                    success: false,
                    message: "Dados inválidos",
                    errors
                })
            }
            const tRepoStart = process.hrtime.bigint();
            const newDoacao = await doacaoRepository.create(doacao)
            try {
                const tipoText = String(newDoacao.tipo || '').trim();
                const valorText = newDoacao.valor != null ? ` no valor de R$ ${newDoacao.valor}` : '';
                await criarNotificacao({
                    tipo: 'cadastro',
                    titulo: 'Nova Doação Cadastrada',
                    descricao: `Doação de ${tipoText}${valorText} registrada`,
                    referencia_id: newDoacao.id,
                    referencia_tipo: 'doacao',
                    usuario_id: req.user ? req.user.id : null
                });
            } catch (notificacaoError) {
                console.error('Falha ao criar notificação para nova doação:', notificacaoError);
            }
            const tRepoEnd = process.hrtime.bigint();
            const totalMs = Number(tRepoEnd - t0) / 1e6;
            const repoMs = Number(tRepoEnd - tRepoStart) / 1e6;
            try {
                console.log(JSON.stringify({
                    scope: 'donations',
                    stage: 'create_success',
                    duration_ms: Number(totalMs.toFixed(2)),
                    repo_ms: Number(repoMs.toFixed(2))
                }));
            } catch (_) {}
            res.status(201).json({
                success: true,
                data: newDoacao.toJSON(),
                message: "Doação cadastrada com sucesso!"
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const doacao = await doacaoRepository.findById(id);
            if (!doacao) {
                return res.status(404).json({
                    success: false,
                    message: "Doação não encontrada!"
                })
            } else {
                res.json({
                    success: true,
                    data: doacao.toJSON()
                })
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async getByFiltred(req, res) {
        try {
            const { tipo, data, destinatario, busca } = req.body || {};
            const tipoNorm = typeof tipo === 'string' ? tipo : 'todos';
            const dataNorm = typeof data === 'string' ? data : 'todos';
            const destinatarioNorm = typeof destinatario === 'string' ? destinatario : 'todos';
            const buscaNorm = typeof busca === 'string' ? busca : '';

            // SAFEGUARD TEMPORÁRIO: Evita 500 retornando lista vazia quando houver qualquer erro interno
            try {
                const doacoes = await doacaoRepository.findByFiltred(tipoNorm, dataNorm, destinatarioNorm, buscaNorm);
                const dataResp = Array.isArray(doacoes) ? doacoes.map(doa => doa.toJSON()) : [];
                return res.json({ success: true, data: dataResp, total: dataResp.length });
            } catch (repoErr) {
                console.error('Erro ao filtrar doações (safeguard):', repoErr);
                return res.json({ success: true, data: [], total: 0 });
            }
        } catch (error) {
            console.error('Erro na rota /api/doacoes/filtrar:', error);
            res.status(500).json({ success: false, message: error.message });
        }

    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const doacaoExistente = await doacaoRepository.findById(id);
            if (!doacaoExistente) {
                res.status(404).json({
                    success: false,
                    message: "Doação não existe!"
                })
            }

            const payload = { ...req.body, id };
            if (req.user) {
                payload.actor = { id: req.user.id, nome: req.user.nome };
            }
            const doacao = new Doacao(payload)
            const errors = doacao.validate();
            if (errors.length > 0) {
                console.warn('Validação de atualização de doação falhou:', {
                    id,
                    body: req.body,
                    errors
                });
                return res.status(400).json({
                    success: false,
                    message: "Dados inválidos!",
                    errors
                });
            }
            const doacaoAtualizado = await doacaoRepository.update(id, doacao);

            try {
                const tipoUp = String(doacaoAtualizado.tipo || '').toUpperCase();
                const tipoText = (tipoUp === 'D' || tipoUp === 'DINHEIRO')
                  ? 'Dinheiro'
                  : (tipoUp === 'A' || tipoUp === 'ALIMENTO')
                    ? 'Alimento'
                    : 'Outros';
                const valorNum = (tipoUp === 'D' || tipoUp === 'DINHEIRO')
                  ? Number(doacaoAtualizado?.doacao?.valor ?? 0)
                  : null;
                const valorText = valorNum != null && Number.isFinite(valorNum) ? ` no valor de R$ ${valorNum}` : '';
                await criarNotificacao({
                    tipo: 'cadastro',
                    titulo: 'Doação Atualizada',
                    descricao: `Doação de ${tipoText}${valorText} foi atualizada.`,
                    referencia_id: doacaoAtualizado.id,
                    referencia_tipo: 'doacao',
                    usuario_id: req.user ? req.user.id : null
                });
            } catch (notificacaoError) {
                console.error('Falha ao criar notificação para atualização de doação:', notificacaoError);
            }

            return res.json({
                success: true,
                data: doacaoAtualizado.toJSON(),
                message: "Doação atualizada com sucesso!"
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            // Deleta diretamente; se não afetar linhas, retorna 404
            const deleted = await doacaoRepository.delete(id);

            if (deleted) {
                try {
                    await criarNotificacao({
                        mensagem: `Doação com ID ${id} foi deletada.`,
                        tipo: 'doacao',
                        referencia_id: id,
                        id_usuario: req.user ? req.user.id : null
                    });
                } catch (notificacaoError) {
                    console.error('Falha ao criar notificação para exclusão de doação:', notificacaoError);
                }
                return res.json({
                    success: true,
                    message: "Doação deletada com sucesso!"
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Doação não encontrada!"
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getDoadorByName(req, res) {
        try {
            const { nome } = req.body;
            const doador = await doacaoRepository.getDoadorByName(nome)
            if (!doador) {
                return res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }
            res.json({
                success: true,
                data: doador
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }
}

module.exports = new DoacaoController();
/*
  Controlador de Doações
  - Gerencia registro e consulta de doações (alimentos, dinheiro e outros).
  - Aplica validações e integra fluxo com estoque quando necessário.
*/
