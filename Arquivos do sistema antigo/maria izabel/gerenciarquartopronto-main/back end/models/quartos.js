class Quarto {
  constructor(data) {
    this.id = data.id !== undefined && data.id !== null ? parseInt(data.id) : null;
    this.numero = data.numero !== undefined && data.numero !== null ? parseInt(data.numero) : null;
    this.tipo = data.tipo || null;
    this.leitos = data.leitos !== undefined && data.leitos !== null ? parseInt(data.leitos) : null;
    this.ocupacao = data.ocupacao !== undefined && data.ocupacao !== null ? parseInt(data.ocupacao) : 0;
    this.status = data.status || 'Disponível';
    this.andar = data.andar !== undefined && data.andar !== null ? parseInt(data.andar) : null;
    this.observacao = data.observacao || null;
  }

  validate() {
    const errors = [];

    if (this.numero === null || isNaN(this.numero) || this.numero <= 0) {
      errors.push('Número do quarto é obrigatório e deve ser numérico');
    }

    if (!this.tipo || this.tipo.trim().length === 0) {
      errors.push('Tipo é obrigatório');
    }

    if (this.leitos === null || isNaN(this.leitos) || this.leitos <= 0) {
      errors.push('Número de leitos é obrigatório e deve ser numérico');
    }

    if (this.ocupacao === null || isNaN(this.ocupacao) || this.ocupacao < 0) {
      errors.push('Ocupação deve ser numérica e igual ou maior que zero');
    }

    const validStatus = ['Disponível', 'Ocupado'];
    if (!validStatus.includes(this.status)) {
      errors.push('Status inválido');
    }

    if (this.andar === null || isNaN(this.andar) || this.andar < 0) {
      errors.push('Andar é obrigatório e deve ser numérico');
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      numero: this.numero,
      tipo: this.tipo,
      leitos: this.leitos,
      ocupacao: this.ocupacao,
      status: this.status,
      andar: this.andar,
      observacao: this.observacao
    };
  }
}

module.exports = Quarto;
