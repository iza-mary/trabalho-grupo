// Arquivo temporário
const doacaoRepository = require("../repository/doacaoRepository.js");

class DoacaoRepository {

    async getAllByDoadorDoacao(req, res) {
        try {
            const result = await doacaoRepository.findAllDoadorComDoacao();
            res.json({
                success: true,
                data: result
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async createDoacao(req, res) {
        const { idDoador, doacaoNome, qntd } = req.body;
        try {
            const created = await doacaoRepository.createDoacao(idDoador, doacaoNome, qntd);
            res.status(201).json({
                success: true,
                data: created
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new DoacaoRepository();