class DoadorController {
    constructor(service) {
        this.service = service;
    }

    async getAll(req, res) {
        try {
            const doadores = await this.service.getAll();
            res.json({
                success: true,
                data: doadores.map(d => d.toJSON()),
                total: doadores.length
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async getByBusca(req, res) {
        try {
            const { filtros } = req.body;
            const doadores = await this.service.getByBusca(filtros || []);
            res.json({
                success: true,
                data: doadores.map(d => d.toJSON()),
                total: doadores.length
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async create(req, res) {
        try {
            const newDoador = await this.service.create(req.body);
            res.status(201).json({
                success: true,
                data: newDoador.toJSON(),
                message: "Doador gravado com sucesso"
            })
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: "Dados inválidos",
                    errors: error.errors || []
                })
            }
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const doador = await this.service.getById(id);
            if (!doador) {
                return res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }
            res.json({
                success: true,
                data: doador.toJSON()
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const doadorAtualizado = await this.service.update(id, req.body);
            return res.json({
                success: true,
                data: doadorAtualizado.toJSON(),
                message: "Doador atualizado com sucesso"
            })
        } catch (error) {
            if (error.name === 'NotFoundError') {
                return res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    success: false,
                    message: "Dados inválido",
                    errors: error.errors || []
                })
            }
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            if (deleted) {
                return res.json({
                    success: true,
                    message: "Doador deletado com sucesso"
                })
            }
            return res.status(404).json({
                success: false,
                message: "Doador não encontrado"
            })
        } catch (error) {
            if (error.name === 'NotFoundError') {
                return res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }
}

module.exports = DoadorController;