const Doador = require("../models/doador");
const DoadorRepository = require("../repository/doadoRepository");

class DoadorController {
    async getAll(req, res) {
        try {
            const doadores = await DoadorRepository.findAll();
            res.json({
                success: true,
                data: doadores.map(doadr => doadr.toJSON()),
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
            const {filtros} = req.body;
            const doadores = await DoadorRepository.getByBusca(filtros)
            res.json({
                success: true,
                data: doadores.map(doadr => doadr.toJSON()),
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
            const doador = new Doador(req.body);
            const errors = doador.validate();
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Dados inválidos",
                    errors
                })
            }
            const newDoador = await DoadorRepository.create(doador)
            res.status(201).json({
                success: true,
                data: newDoador.toJSON(),
                message: "Doador gravado com sucesso"
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const doador = await DoadorRepository.findById(id)
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
            const doadorExistente = await DoadorRepository.findById(id);
            if (!doadorExistente) {
                res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }
            const doador = new Doador({ ...req.body, id })
            const errors = doador.validate();
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Dados inválido",
                    errors
                })
            }
            const doadorAtualizado = await DoadorRepository.update(id, doador);
            return res.json({
                success: true,
                data: doadorAtualizado.toJSON(),
                message: "Doador atualizado com sucesso"
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
            const doador = await DoadorRepository.findById(id);
            if (!doador) {
                return res.status(404).json({
                    success: false,
                    message: "Doador não encontrado"
                })
            }
            const deleted = await DoadorRepository.delete(id)
            if (deleted) {
                res.json({
                    success: true,
                    message: "Doador deletado com sucesso"
                })
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            })
        }
    }
}

module.exports = new DoadorController();