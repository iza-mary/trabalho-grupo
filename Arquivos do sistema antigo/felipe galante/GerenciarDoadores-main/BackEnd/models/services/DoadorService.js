// Serviço de regras do Doador: aplica validações e conversa com o repositório
const Doador = require('../doador')

class ValidationError extends Error {
    constructor(errors) {
        super('Validation failed')
        this.name = 'ValidationError'
        this.errors = errors
    }
}

class NotFoundError extends Error {
    constructor() {
        super('Not found')
        this.name = 'NotFoundError'
    }
}

class DoadorService {
    constructor(repository) {
        // Repositório de dados injetado
        this.repository = repository
    }

    async getAll() {
        return await this.repository.findAll()
    }

    async getByBusca(filtros) {
        return await this.repository.getByBusca(filtros)
    }

    async getById(id) {
        return await this.repository.findById(id)
    }

    async create(data) {
        // Valida dados antes de salvar
        const doador = new Doador(data)
        const errors = doador.validate()
        if (errors.length > 0) throw new ValidationError(errors)
        const created = await this.repository.create(doador)
        return created
    }

    async update(id, data) {
        // Confere existência, valida e então atualiza
        const existente = await this.repository.findById(id)
        if (!existente) throw new NotFoundError()
        const doador = new Doador({ ...data, id })
        const errors = doador.validate()
        if (errors.length > 0) throw new ValidationError(errors)
        const atualizado = await this.repository.update(id, doador)
        return atualizado
    }

    async delete(id) {
        // Exclui somente se existir
        const existente = await this.repository.findById(id)
        if (!existente) throw new NotFoundError()
        return await this.repository.delete(id)
    }
}

module.exports = { DoadorService, ValidationError, NotFoundError }