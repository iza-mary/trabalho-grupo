const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'deletions.log');
const SEC_FILE = path.join(LOG_DIR, 'security.log');

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {}
}

function logDeletion(entry) {
  try {
    ensureLogDir();
    const payload = {
      timestamp: new Date().toISOString(),
      action: 'delete',
      ...entry
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(payload) + '\n', { encoding: 'utf8' });
  } catch (err) {
    // Evita quebrar fluxo por falha de log
    console.warn('Falha ao registrar log de deleção:', err?.message || err);
  }
}

function logSecurityEvent(entry) {
  try {
    ensureLogDir();
    const payload = {
      timestamp: new Date().toISOString(),
      action: 'security',
      ...entry,
    };
    fs.appendFileSync(SEC_FILE, JSON.stringify(payload) + '\n', { encoding: 'utf8' });
  } catch (err) {
    console.warn('Falha ao registrar evento de segurança:', err?.message || err);
  }
}

module.exports = { logDeletion, logSecurityEvent };