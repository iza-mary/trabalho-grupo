function toNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

// Decide se devemos atualizar estoque manualmente após inserir doação de produto.
// Evita duplicação quando o banco já atualizou via trigger/processo paralelo.
// Retorna { shouldUpdate: boolean, targetQty: number }
function computeStockUpdate(preQty, postQty, donatedQty) {
  const pre = toNumber(preQty);
  const post = toNumber(postQty);
  const donated = toNumber(donatedQty);
  if (donated <= 0) {
    return { shouldUpdate: false, targetQty: post };
  }
  const delta = post - pre;
  if (delta >= donated) {
    // Estoque já foi incrementado (provavelmente por trigger). Não atualizar novamente.
    return { shouldUpdate: false, targetQty: post };
  }
  return { shouldUpdate: true, targetQty: pre + donated };
}

module.exports = { computeStockUpdate };
/*
  Guarda de Atualização de Estoque
  - Impede alterações concorrentes ou inválidas em saldos de estoque.
*/