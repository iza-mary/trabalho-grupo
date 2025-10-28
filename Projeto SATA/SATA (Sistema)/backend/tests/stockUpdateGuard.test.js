const { computeStockUpdate } = require('../utils/stockUpdateGuard');
const { isDuplicateDonation } = require('../utils/donationDedup');

function assert(condition, message) {
  if (!condition) {
    console.error('✗', message);
    process.exitCode = 1;
  } else {
    console.log('✓', message);
  }
}

console.log('Testes: stockUpdateGuard e deduplicação de doações');

// Cadastro de doação única
(() => {
  const res = computeStockUpdate(10, 10, 5);
  assert(res.shouldUpdate === true, 'Deve atualizar quando não houve trigger');
  assert(res.targetQty === 15, 'Quantidade final correta após doação única');
})();

// Verificação do estoque após cadastro (trigger já atualizou)
(() => {
  const res = computeStockUpdate(10, 15, 5);
  assert(res.shouldUpdate === false, 'Não deve atualizar quando já incrementado');
  assert(res.targetQty === 15, 'Mantém estoque já atualizado por trigger');
})();

// Tentativas de cadastro duplicado
(() => {
  const existing = { doadorId: 1, data: '2025-10-01', tipo: 'P', produtoId: 7, quantidade: 3 };
  const incoming = { doadorId: 1, data: '2025-10-01', tipo: 'p', produtoId: 7, quantidade: 3 };
  assert(isDuplicateDonation(existing, incoming) === true, 'Detecta duplicidade por igualdade de campos');
})();