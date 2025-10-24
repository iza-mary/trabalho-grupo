const doacaoRepository = require("../repository/doacaoRepository");
const Doacao = require("../models/doacao");

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
            const doacao = new Doacao(req.body);
            const errors = doacao.validate();
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Dados inválidos",
                    errors
                })
            }
            const newDoacao = await doacaoRepository.create(doacao)
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

            const doacao = new Doacao({ ...req.body, id })
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