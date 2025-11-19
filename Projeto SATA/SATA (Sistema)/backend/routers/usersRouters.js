const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const rateBuckets = {
  create: new Map(),
  resend: new Map()
};

function rateLimit(key, bucket, limit, windowMs) {
  const now = Date.now();
  const entry = bucket.get(key) || { count: 0, start: now };
  if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
  entry.count += 1;
  bucket.set(key, entry);
  return entry.count <= limit;
}

router.get('/', authenticate, authorizeRoles('Admin'), (req, res) => usersController.list(req, res));
router.post('/', authenticate, authorizeRoles('Admin'), (req, res, next) => {
  const ok = rateLimit(req.ip, rateBuckets.create, 10, 10 * 60 * 1000);
  if (!ok) return res.status(429).json({ success: false, error: 'Limite de criação atingido. Tente novamente mais tarde.' });
  next();
}, (req, res) => usersController.create(req, res));
router.put('/:id', authenticate, authorizeRoles('Admin'), (req, res) => usersController.update(req, res));
router.delete('/:id', authenticate, authorizeRoles('Admin'), (req, res) => usersController.remove(req, res));
router.patch('/:id/status', authenticate, authorizeRoles('Admin'), (req, res) => usersController.setStatus(req, res));
router.post('/:id/resend-validation', authenticate, authorizeRoles('Admin'), (req, res, next) => {
  const ok = rateLimit(req.ip, rateBuckets.resend, 3, 15 * 60 * 1000);
  if (!ok) return res.status(429).json({ success: false, error: 'Limite de reenvio atingido. Tente novamente mais tarde.' });
  next();
}, (req, res) => usersController.resendValidation(req, res));
router.get('/validate-email', (req, res) => usersController.validateEmail(req, res));

module.exports = router;
/*
  Rotas de Usuários
  - Endpoints administrativos para gestão de perfis e status.
  - Prefixo: `/api/users`.
*/