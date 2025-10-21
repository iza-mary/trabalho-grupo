class Financeiro {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.descricao = data.descricao ?? '';
    this.valor = data.valor != null ? Number(data.valor) : null;
    this.tipo = data.tipo ?? '';
    this.categoria = data.categoria ?? '';
    this.forma_pagamento = data.forma_pagamento ?? '';
    this.data = data.data ?? null; // esperado YYYY-MM-DD
    this.observacao = data.observacao ?? null;
    this.created_at = data.created_at ?? null;
    this.updated_at = data.updated_at ?? null;
    // Campos de recorrência
    this.recorrente = data.recorrente ? Boolean(Number(data.recorrente)) || data.recorrente === true : false;
    this.frequencia_recorrencia = data.frequencia_recorrencia ?? (this.recorrente ? 'Mensal' : null);
    this.ocorrencias_recorrencia = data.ocorrencias_recorrencia != null
      ? Number.parseInt(data.ocorrencias_recorrencia, 10)
      : (this.recorrente ? 1 : null);
  }

  validate() {
    const errors = [];
    if (!this.descricao || String(this.descricao).trim().length === 0) {
      errors.push('Descrição é obrigatória');
    }
    if (this.valor == null || isNaN(Number(this.valor)) || Number(this.valor) <= 0) {
      errors.push('Valor deve ser um número positivo');
    }
    const tiposValidos = ['Entrada', 'Saída'];
    if (!tiposValidos.includes(String(this.tipo))) {
      errors.push('Tipo inválido (permitidos: Entrada, Saída)');
    }
    const categoriasValidas = ['Doações','Patrocínios','Salários','Fornecedores','Manutenção','Outros'];
    if (!categoriasValidas.includes(String(this.categoria))) {
      errors.push('Categoria inválida');
    }
    const formasPagamentoValidas = ['Dinheiro','PIX','Transferência Bancária','Cartão de Débito','Cartão de Crédito','Cheque'];
    if (!formasPagamentoValidas.includes(String(this.forma_pagamento))) {
      errors.push('Forma de pagamento inválida');
    }
    // Validação simples de data (YYYY-MM-DD)
    if (!this.data || !/^\d{4}-\d{2}-\d{2}$/.test(String(this.data))) {
      errors.push('Data deve estar no formato YYYY-MM-DD');
    }
    // Validações de recorrência
    if (this.recorrente) {
      const frequenciasValidas = ['Diária','Semanal','Mensal','Bimestral','Trimestral','Semestral','Anual'];
      if (!this.frequencia_recorrencia || !frequenciasValidas.includes(String(this.frequencia_recorrencia))) {
        errors.push('Frequência de recorrência inválida ou não informada');
      }
      if (this.ocorrencias_recorrencia == null || isNaN(this.ocorrencias_recorrencia) || this.ocorrencias_recorrencia < 1) {
        errors.push('Ocorrências da recorrência devem ser um inteiro >= 1');
      }
    }
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      descricao: this.descricao,
      valor: this.valor,
      tipo: this.tipo,
      categoria: this.categoria,
      forma_pagamento: this.forma_pagamento,
      data: this.data,
      observacao: this.observacao,
      created_at: this.created_at,
      updated_at: this.updated_at,
      recorrente: this.recorrente,
      frequencia_recorrencia: this.frequencia_recorrencia,
      ocorrencias_recorrencia: this.ocorrencias_recorrencia,
    };
  }
}

module.exports = Financeiro;