class DoadorController {
  constructor(service) {
    this.service = service;
  }

  async getAll() {
    return await this.service.getAll();
  }

  async getByBusca(filtros) {
    return await this.service.getByBusca(filtros);
  }

  async add(doador) {
    return await this.service.add(doador);
  }

  async update(doador) {
    return await this.service.update(doador);
  }

  async remove(id) {
    return await this.service.remove(id);
  }
}

export default DoadorController