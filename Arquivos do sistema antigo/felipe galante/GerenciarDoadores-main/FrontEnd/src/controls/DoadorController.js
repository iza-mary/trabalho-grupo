// Coordenador do frontend: organiza pedidos da tela e usa o serviço
class DoadorController {
  constructor(service) {
    // Serviço que chama a API do backend
    this.service = service;
  }

  async getAll() {
    // Lista doadores
    return await this.service.getAll();
  }

  async getByBusca(filtros) {
    // Filtra doadores por termos
    return await this.service.getByBusca(filtros);
  }

  async add(doador) {
    // Cria novo doador
    return await this.service.add(doador);
  }

  async update(doador) {
    // Atualiza doador existente
    return await this.service.update(doador);
  }

  async remove(id) {
    // Remove doador pelo id
    return await this.service.remove(id);
  }
}

export default DoadorController