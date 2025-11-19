class Produto {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = (data.nome || '').trim();
    this.categoria = data.categoria || null;
    this.unidade_medida = data.unidade_medida || 'Unidade';
    this.estoque_atual = data.estoque_atual != null ? parseInt(data.estoque_atual, 10) : 0;
    this.estoque_minimo = data.estoque_minimo != null ? parseInt(data.estoque_minimo, 10) : 0;
    this.observacao = data.observacao || null;
    this.descricao = data.descricao || null;
    this.preco = data.preco != null ? Number(data.preco) : 0;
    this.quantidade = data.quantidade != null ? parseInt(data.quantidade, 10) : 0;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.data_cadastro = data.data_cadastro || null;
    this.data_atualizacao = data.data_atualizacao || null;
  }

  validate() {
    const errors = [];
    const categoriasValidas = ['Alimentos','Higiene','Medicamentos','Roupas','Limpeza','Outros'];
    const unidadesValidas = ['Unidade','Kg','L','Pacote','Caixa','Outro'];

    if (!this.nome) errors.push('nome é obrigatório');
    if (!this.categoria || !categoriasValidas.includes(this.categoria)) errors.push('categoria inválida');
    if (!this.unidade_medida || !unidadesValidas.includes(this.unidade_medida)) errors.push('unidade_medida inválida');

    if (this.preco < 0) errors.push('preco deve ser >= 0');
    if (!Number.isFinite(this.preco)) errors.push('preco inválido');

    if (this.quantidade < 0) errors.push('quantidade deve ser >= 0');
    if (!Number.isInteger(this.quantidade)) errors.push('quantidade inválida');

    if (this.estoque_atual < 0) errors.push('estoque_atual deve ser >= 0');
    if (!Number.isInteger(this.estoque_atual)) errors.push('estoque_atual inválido');

    if (this.estoque_minimo < 0) errors.push('estoque_minimo deve ser >= 0');
    if (!Number.isInteger(this.estoque_minimo)) errors.push('estoque_minimo inválido');

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      categoria: this.categoria,
      unidade_medida: this.unidade_medida,
      estoque_atual: this.estoque_atual,
      estoque_minimo: this.estoque_minimo,
      observacao: this.observacao,
      descricao: this.descricao,
      preco: this.preco,
      quantidade: this.quantidade,
      created_at: this.created_at,
      updated_at: this.updated_at,
      data_cadastro: this.data_cadastro,
      data_atualizacao: this.data_atualizacao,
    };
  }
}

module.exports = Produto;
/*
  Modelo Produto
  - Define estrutura e validações de produtos e limites de estoque.
*/