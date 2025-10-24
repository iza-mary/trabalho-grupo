const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Autenticação
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/me', authenticate, (req, res) => authController.me(req, res));

// Recuperação e troca de senha
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));
router.post('/change-password', authenticate, (req, res) => authController.changePassword(req, res));

// Registro (opcional; normalmente apenas Admin)
router.post('/register', (req, res) => authController.register(req, res));

module.exports = router;