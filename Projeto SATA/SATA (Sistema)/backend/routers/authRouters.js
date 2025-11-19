const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

const rlMap = new Map();
function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const rec = rlMap.get(key) || { count: 0, start: now };
    if (now - rec.start > windowMs) {
      rec.count = 0;
      rec.start = now;
    }
    rec.count += 1;
    rlMap.set(key, rec);
    if (rec.count > max) {
      return res.status(429).json({ success: false, error: 'Muitas tentativas. Tente novamente mais tarde.' });
    }
    next();
  };
}

// Autenticação
router.post('/login', rateLimit({ windowMs: 10 * 60 * 1000, max: 30 }), (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/me', authenticate, (req, res) => authController.me(req, res));

// Recuperação e troca de senha
router.post('/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));
router.post('/change-password', authenticate, (req, res) => authController.changePassword(req, res));

// Registro (opcional; normalmente apenas Admin)
router.post('/register', (req, res) => authController.register(req, res));

router.get('/check-unique', (req, res) => authController.checkUnique(req, res));

module.exports = router;
/*
  Rotas de Autenticação
  - Endpoints públicos: login, logout, me, registro e recuperação de senha.
  - Prefixo: `/api/auth`.
*/