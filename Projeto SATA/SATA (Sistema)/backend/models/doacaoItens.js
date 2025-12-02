class DoacaoItens {
  constructor(data = {}) {
    this.descricao_item = data?.descricao_item ?? data?.doacao?.descricao_item ?? data?.item ?? null;
    this.quantidade = data?.quantidade ?? data?.quantidade_item ?? data?.doacao?.quantidade ?? data?.qntd ?? null;
    this.estado_conservacao = data?.estado_conservacao ?? data?.doacao?.estado_conservacao ?? 'bom';
    this.unidade_medida = data?.unidade_medida ?? data?.doacao?.unidade_medida ?? null;
    this.produto_nome = data?.produto_nome ?? null;
    this.produto_categoria = data?.produto_categoria ?? null;
  }

  validate() {
    const errors = [];
    if (!this.descricao_item || String(this.descricao_item).trim().length === 0) {
      errors.push('Descrição do item é obrigatória');
    }
    if (!this.quantidade || Number(this.quantidade) <= 0) {
      errors.push('Quantidade inválida');
    }
    return errors;
  }

  toJSON() {
    return {
      descricao_item: this.descricao_item,
      quantidade: this.quantidade,
      estado_conservacao: this.estado_conservacao,
      unidade_medida: this.unidade_medida,
      produto_nome: this.produto_nome,
      produto_categoria: this.produto_categoria,
    };
  }
}

module.exports = DoacaoItens
