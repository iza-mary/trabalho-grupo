class DoacaoAlimentos {
  constructor(data = {}) {
    this.tipo_alimento = data?.tipo_alimento ?? data?.doacao?.tipo_alimento ?? data?.item ?? null;
    this.quantidade = data?.quantidade ?? data?.quantidade_alimento ?? data?.doacao?.quantidade ?? data?.qntd ?? null;
    this.validade = data?.validade ?? null;
    this.produto_nome = data?.produto_nome ?? null;
    this.produto_categoria = data?.produto_categoria ?? 'Alimentos';
  }

  validate() {
    const errors = [];
    if (!this.tipo_alimento || String(this.tipo_alimento).trim().length === 0) {
      errors.push('Tipo de alimento é obrigatório');
    }
    if (!this.quantidade || Number(this.quantidade) <= 0) {
      errors.push('Quantidade inválida');
    }
    return errors;
  }

  toJSON() {
    return {
      tipo_alimento: this.tipo_alimento,
      quantidade: this.quantidade,
      validade: this.validade,
      produto_nome: this.produto_nome,
      produto_categoria: this.produto_categoria,
    };
  }
}

module.exports = DoacaoAlimentos
