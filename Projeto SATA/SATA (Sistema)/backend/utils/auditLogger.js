// Audit logger no-op: remove interação com o sistema de arquivos.
// Mantém API compatível para que os controllers possam importar sem erros.

function logDeletion() {
  // Intencionalmente vazio para evitar escrita em disco.
}

function logSecurityEvent() {
  // Intencionalmente vazio para evitar escrita em disco.
}

module.exports = { logDeletion, logSecurityEvent };