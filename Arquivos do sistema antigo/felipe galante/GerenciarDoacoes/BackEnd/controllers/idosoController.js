const idosoRepository = require("../repository/idosoRepository");

class IdosoController {
    async getAll(req, res) {
        try {
            const { nome } = req.query;
            const idosos = nome
                ? await idosoRepository.findByNome(nome)
                : await idosoRepository.findAll();
            res.json({ success: true, data: idosos, total: idosos.length });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new IdosoController();