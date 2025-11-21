import DoadorController from './DoadorController'
import doadorService from '../services/doadorService'

const doadorController = new DoadorController(doadorService)

export { doadorController }