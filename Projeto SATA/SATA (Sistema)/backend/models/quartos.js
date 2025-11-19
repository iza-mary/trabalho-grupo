class Quarto {
  constructor(data) {
    this.id = data.id !== undefined && data.id !== null ? parseInt(data.id) : null;
    this.numero = data.numero !== undefined && data.numero !== null ? String(data.numero) : null;
    this.capacidade = data.capacidade !== undefined && data.capacidade !== null ? parseInt(data.capacidade) : null;
    this.descricao = data.descricao ?? null;
    this.status = data.status || 'disponivel';
    this.data_cadastro = data.data_cadastro || null;
    this.data_atualizacao = data.data_atualizacao || null;
  }

  validate() {
    const errors = [];

    if (!this.numero || String(this.numero).trim().length === 0) {
      errors.push('Número do quarto é obrigatório');
    }

    if (this.capacidade === null || isNaN(this.capacidade) || this.capacidade <= 0) {
      errors.push('Capacidade é obrigatória e deve ser numérica (> 0)');
    }

    const validStatus = ['disponivel', 'ocupado'];
    if (this.status && !validStatus.includes(this.status)) {
      errors.push('Status inválido');
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      numero: this.numero,
      capacidade: this.capacidade,
      descricao: this.descricao,
      status: this.status,
      data_cadastro: this.data_cadastro,
      data_atualizacao: this.data_atualizacao
    };
  }
}

module.exports = Quarto;
/*
  Modelo Quartos
  - Estrutura para unidades de quarto e capacidade/ocupação.
*/
