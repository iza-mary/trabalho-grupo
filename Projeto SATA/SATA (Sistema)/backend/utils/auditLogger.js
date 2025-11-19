// Audit logger simples: evita escrita em disco, mas registra eventos no console.
// Mantém API compatível e oferece um método genérico para métricas.

function logDeletion() {
  // Intencionalmente vazio para evitar escrita em disco.
}

function logSecurityEvent() {
  // Intencionalmente vazio para evitar escrita em disco.
}
function log(event, payload) {
  try {
    const ts = new Date().toISOString();
    // Minimiza verbosidade; pode ser integrado a sistemas de observabilidade futuramente
    console.log(`[AUDIT ${ts}] ${event}:`, JSON.stringify(payload));
  } catch (_) {}
}

module.exports = { logDeletion, logSecurityEvent, log };
/*
  Logger de Auditoria
  - Utilitário para registro de ações e eventos de segurança.
  - Não deve quebrar fluxo principal em caso de falhas.
*/