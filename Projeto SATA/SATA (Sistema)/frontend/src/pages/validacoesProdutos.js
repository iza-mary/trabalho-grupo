export const categoriasProdutos = [
  'Alimentos',
  'Higiene',
  'Medicamentos',
  'Roupas',
  'Limpeza',
  'Outros'
];

export const unidadesMedidaProdutos = [
  'Unidade(s)',
  'Kg',
  'L',
  'Pacotes',
  'Caixas',
  'Outro',
  'm'
];

const isWholeNumber = (v) => /^\d+$/.test(String(v ?? '').trim());
const isNumber = (v) => !Number.isNaN(Number(String(v ?? '').replace(',', '.')));

export const validarProduto = (formData) => {
  const erros = {};

  if (!formData.nome || !formData.nome.trim || !formData.nome.trim()) {
    erros.nome = 'Nome é obrigatório';
  } else if (formData.nome.trim().length < 2) {
    erros.nome = 'Nome deve ter pelo menos 2 caracteres';
  }

  if (!formData.categoria) {
    erros.categoria = 'Categoria é obrigatória';
  } else if (!categoriasProdutos.includes(formData.categoria)) {
    erros.categoria = 'Categoria inválida';
  }

  if (!formData.unidade_medida) {
    erros.unidade_medida = 'Unidade de medida é obrigatória';
  } else if (!unidadesMedidaProdutos.includes(formData.unidade_medida)) {
    erros.unidade_medida = 'Unidade de medida inválida';
  }

  // estoque_atual removido do formulário: não validar obrigatoriedade
  // Se necessário, back-end aplica defaults e validações

  if (isWholeNumber(formData.estoque_minimo)) {
    const minimo = Number(formData.estoque_minimo);
    if (minimo < 0) {
      erros.estoque_minimo = 'Estoque mínimo não pode ser negativo';
    }
  }

  // Preço: obrigatório? Schema tem default 0.00; não exigir, mas validar se informado
  if (formData.preco !== undefined && String(formData.preco).trim() !== '') {
    if (!isNumber(formData.preco)) {
      erros.preco = 'Preço inválido';
    } else if (Number(String(formData.preco).replace(',', '.')) < 0) {
      erros.preco = 'Preço não pode ser negativo';
    }
  }

  // Quantidade: idem, validar se informado
  if (formData.quantidade !== undefined && String(formData.quantidade).trim() !== '') {
    if (!isWholeNumber(formData.quantidade)) {
      erros.quantidade = 'Quantidade deve ser um número inteiro';
    } else if (Number(formData.quantidade) < 0) {
      erros.quantidade = 'Quantidade não pode ser negativa';
    }
  }

  // Descrição e Observação são opcionais
  return erros;
};

export const normalizarProdutoPayload = (formData) => {
  const precoStr = String(formData.preco ?? '').trim();
  const precoNum = precoStr ? Number(precoStr.replace(',', '.')) : 0;
  const quantidadeStr = String(formData.quantidade ?? '').trim();
  const quantidadeNum = quantidadeStr ? parseInt(quantidadeStr, 10) : 0;

  return {
    nome: String(formData.nome || '').trim(),
    categoria: formData.categoria,
    unidade_medida: formData.unidade_medida,
    estoque_atual: parseInt(String(formData.estoque_atual).trim() || '0', 10),
    estoque_minimo: parseInt(String(formData.estoque_minimo).trim() || '0', 10),
    observacao: formData.observacao && formData.observacao.trim ? (formData.observacao.trim() || null) : null,
    descricao: formData.descricao && formData.descricao.trim ? (formData.descricao.trim() || null) : null,
    preco: Number.isFinite(precoNum) && precoNum >= 0 ? precoNum : 0,
    quantidade: Number.isInteger(quantidadeNum) && quantidadeNum >= 0 ? quantidadeNum : 0,
  };
};
