const MySqlDoadorRepository = require('../models/repositories/MySqlDoadorRepository')
const { DoadorService } = require('../models/services/DoadorService')
const DoadorController = require('../controls/doadorController')

const repository = new MySqlDoadorRepository()
const service = new DoadorService(repository)
const doadorController = new DoadorController(service)

module.exports = { doadorController, service, repository }