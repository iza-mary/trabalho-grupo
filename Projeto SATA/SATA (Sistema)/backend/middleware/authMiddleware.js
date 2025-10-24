const jwt = require('jsonwebtoken');

const normalizeRole = (role) => {
  if (!role) return 'Funcionário';
  const r = String(role).toLowerCase();
  if (r.includes('admin')) return 'Admin';
  if (r.includes('funcion')) return 'Funcionário';
  if (r.includes('user') || r.includes('usuário') || r.includes('usuario')) return 'Funcionário';
  return 'Funcionário';
};

function authenticate(req, res, next) {
  // Prioriza cookie httpOnly; aceita Bearer como fallback
  const authHeader = req.headers['authorization'] || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = (req.cookies && req.cookies.auth_token) || bearer;

  if (!token) return res.status(401).json({ success: false, error: 'Não autenticado: token ausente' });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ success: false, error: 'Configuração de JWT ausente' });
    const payload = jwt.verify(token, secret);
    // Normaliza papel no payload para consistência
    payload.role = normalizeRole(payload.role);
    req.user = payload; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Não autenticado' });
    const allowed = roles.map(normalizeRole);
    const current = normalizeRole(req.user.role);
    if (allowed.length && !allowed.includes(current)) {
      return res.status(403).json({ success: false, error: 'Sem permissão' });
    }
    next();
  };
}

function roleAccessControl(req, res, next) {
  // Libera leitura e preflight para Funcionário; escrita só Admin
  const fullPath = `${req.baseUrl || ''}${req.path || ''}`;
  const allowedReadPosts = ['/api/doacoes/filtrar', '/api/doadores/filtrar'];
  const isReadOp = req.method === 'GET' || req.method === 'OPTIONS' || (req.method === 'POST' && allowedReadPosts.includes(fullPath));
  if (isReadOp) return next();
  if (!req.user) return res.status(401).json({ success: false, error: 'Não autenticado' });
  const current = normalizeRole(req.user.role);
  if (current !== 'Admin') {
    return res.status(403).json({ success: false, error: 'Acesso restrito a Administradores' });
  }
  next();
}

module.exports = { authenticate, authorizeRoles, roleAccessControl };