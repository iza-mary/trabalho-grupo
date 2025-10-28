// Heurística de deduplicação: considera doações duplicadas quando
// doadorId, data (exata), tipo, produtoId e quantidade coincidem.
function isDuplicateDonation(existing, incoming) {
  if (!existing || !incoming) return false;
  const sameDoador = String(existing.doadorId || existing.doador) === String(incoming.doadorId || incoming.doador);
  const sameData = String(existing.data).trim() === String(incoming.data).trim();
  const sameTipo = String(existing.tipo).toUpperCase() === String(incoming.tipo).toUpperCase();
  const sameProduto = String(existing.produtoId) === String(incoming.produtoId);
  const sameQuantidade = Number(existing.quantidade) === Number(incoming.quantidade);
  return sameDoador && sameData && sameTipo && sameProduto && sameQuantidade;
}

module.exports = { isDuplicateDonation };