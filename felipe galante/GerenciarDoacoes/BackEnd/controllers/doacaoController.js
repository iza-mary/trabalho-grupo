const doacaoRepository = require("../repository/doacaoRepository");
const Doacao = require("../models/doacao");

class DoacaoController {
    async getAll(req, res) {
        try {
            const { data, tipo } = req.query;
            let doacoes;
            if (data) {
                // doacoes = await DoacaoRepository.findByData(data);
            } else if (tipo) {
                // doacoes = await DoacaoRepository.findByTipo(tipo);
            } else {
                doacoes = await doacaoRepository.findAll();
            }
            
            res.json({
                success: true,
                data: doacoes.map(doa => doa.toJSON()),
                total: doacoes.length
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
            console.log(newDoacao)
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
        const {tipo, data, destinatario, busca} = req.body;
        let doacoes;
        if (tipo || data || destinatario || busca) {
            doacoes = await doacaoRepository.findByFiltred(tipo, data, destinatario, busca)
        }
        res.json({
            success: true,
            data: doacoes.map(doa => doa.toJSON()),
            total: doacoes.length
        })
    } catch(error) {
        res.status(500).json({success: false, message: error.message});
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
            const doacao = await doacaoRepository.findById(id);
            if (!doacao) {
                return res.status(404).json({
                    success: false,
                    message: "Doação não encontrada!"
                })
            }

            const deleted = await doacaoRepository.delete(id);

            if (deleted) {
                res.json({
                    success: true,
                    message: "Doação deletada com sucesso!"
                });
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new DoacaoController();