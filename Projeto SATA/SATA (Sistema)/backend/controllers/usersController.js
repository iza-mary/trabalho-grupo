/*
  Controlador de Usuários
  - CRUD de perfis, atualização de status, validação e reenvio de email.
  - Aplica normalização de papel e políticas de senha.
  - Integra com serviço de email (SMTP) e registra eventos de auditoria quando disponível.
*/
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const UserRepository = require('../repository/userRepository');
const User = require('../models/user');

// Normaliza papel para valores válidos no sistema
function normalizeRole(role) {
  if (!role) return 'Funcionário';
  const r = String(role).toLowerCase();
  if (r.includes('admin')) return 'Admin';
  if (r.includes('funcion')) return 'Funcionário';
  if (r.includes('user') || r.includes('usuário') || r.includes('usuario')) return 'Funcionário';
  return 'Funcionário';
}

class UsersController {
  /*
    Listagem de usuários
    Parâmetros (query): `status`, `role`, `page`, `pageSize`, `search`
    - Suporta paginação e filtro por status/papel e termo de busca.
  */
  async list(req, res) {
    try {
      const { status, role, page = 1, pageSize = 10, search } = req.query;
      const result = await UserRepository.findAll({ status, role, page, pageSize, search });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao listar usuários', detail: err.message });
    }
  }

  /*
    Criação de usuário
    Parâmetros (body): `username`, `email`, `role`, `password`
    - Valida entrada, unicidade e política de senha; cria perfil com status `inativo`.
    - Gera token de validação de email com validade de 24h e envia mensagem.
  */
  async create(req, res) {
    try {
      const { username, email, role, password } = req.body;
      const user = new User({ username, email, password, role: normalizeRole(role) });
      const errors = user.validate({ forCreate: true });
      if (errors.length) return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });
      const pwErr = require('../utils/passwordPolicy').checkPassword(password);
      if (pwErr) return res.status(400).json({ success: false, error: pwErr });
      const existing = await UserRepository.findByUsername(username);
      if (existing) return res.status(409).json({ success: false, error: 'Nome do Usuário já utilizado' });
      const existingEmail = await UserRepository.findByEmail(email);
      if (existingEmail) return res.status(409).json({ success: false, error: 'Email já utilizado' });
      const bcrypt = require('bcryptjs');
      const ph = await bcrypt.hash(String(password), 10);
      const id = await UserRepository.create({ username, email, password_hash: ph, role: normalizeRole(role), status: 'inativo' });

      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await UserRepository.setEmailValidationToken(id, token, expiresAt);

      await sendValidationEmail({ email, username, token });
      try { const { log } = require('../utils/auditLogger'); log('user.create', { id, username, email, role: normalizeRole(role), status: 'inativo', actor: req.user || null }); } catch {}
      return res.status(201).json({ success: true, message: 'Perfil criado. Enviamos um email de confirmação com validade de 24h.', data: { id, username, email, role: normalizeRole(role), status: 'inativo' } });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao criar usuário', detail: err.message });
    }
  }

  /*
    Atualização de usuário
    Parâmetros: `id` (params), `username`, `email`, `role` (body)
    - Garante unicidade ao alterar nome/email e normaliza papel.
  */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { username, email, role } = req.body;
      const current = await UserRepository.findById(id);
      if (!current) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

      if (username !== current.username) {
        const existing = await UserRepository.findByUsername(username);
        if (existing && Number(existing.id) !== Number(id)) return res.status(409).json({ success: false, error: 'Nome do Usuário já utilizado' });
      }
      if (email !== current.email) {
        const existingEmail = await UserRepository.findByEmail(email);
        if (existingEmail && Number(existingEmail.id) !== Number(id)) return res.status(409).json({ success: false, error: 'Email já utilizado' });
      }
      const ok = await UserRepository.updateUser(id, { username, email, role: normalizeRole(role) });
      if (!ok) return res.status(500).json({ success: false, error: 'Falha ao atualizar' });
      try { const { log } = require('../utils/auditLogger'); log('user.update', { id, changes: { username, email, role: normalizeRole(role) }, actor: req.user || null }); } catch {}
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao atualizar usuário', detail: err.message });
    }
  }

  /*
    Exclusão de usuário
    Parâmetros: `id` (params)
    - Remove perfil e registra auditoria de deleção quando disponível.
  */
  async remove(req, res) {
    try {
      const { id } = req.params;
      const ok = await UserRepository.deleteUser(id);
      if (!ok) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      try { const { logDeletion } = require('../utils/auditLogger'); logDeletion({ entity: 'user', id, actor: req.user || null }); } catch {}
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao excluir usuário', detail: err.message });
    }
  }

  /*
    Atualizar status
    Parâmetros: `id` (params), `status` (body: 'ativo'|'inativo')
    - Impede inativação do admin padrão e registra auditoria.
  */
  async setStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['ativo','inativo'].includes(String(status))) return res.status(400).json({ success: false, error: 'Status inválido' });
      const target = await UserRepository.findById(id);
      if (!target) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      const defaultAdminUser = process.env.DEFAULT_ADMIN_USER || 'S4TAdmin';
      if (String(target.username) === defaultAdminUser && String(status) === 'inativo') {
        return res.status(400).json({ success: false, error: 'Não é possível inativar o usuário administrador padrão' });
      }
      const ok = await UserRepository.setStatus(id, status);
      if (!ok) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      try { const { log } = require('../utils/auditLogger'); log('user.status', { id, status, actor: req.user || null }); } catch {}
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao atualizar status', detail: err.message });
    }
  }

  /*
    Validar email
    Parâmetros: `token` (query|params|body)
    - Confirma validação se token é válido e dentro do prazo.
  */
  async validateEmail(req, res) {
    try {
      const raw = (req.query && req.query.token) || (req.params && req.params.token) || (req.body && req.body.token) || '';
      const token = String(raw || '').trim();
      if (!token) return res.status(400).json({ success: false, error: 'Token ausente' });
      const user = await UserRepository.findByValidationToken(token);
      if (!user) return res.status(400).json({ success: false, error: 'Token inválido' });
      const exp = user.email_validation_expires_at ? new Date(user.email_validation_expires_at).getTime() : 0;
      if (Date.now() > exp) return res.status(400).json({ success: false, error: 'Token expirado' });
      await UserRepository.confirmEmailValidation(user.id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao validar email', detail: err.message });
    }
  }

  /*
    Reenviar validação de email
    Parâmetros: `id` (params)
    - Gera novo token de 24h e envia email de confirmação.
  */
  async resendValidation(req, res) {
    try {
      const { id } = req.params;
      const u = await UserRepository.findById(id);
      if (!u) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      if (String(u.status || '').toLowerCase() === 'ativo') return res.status(400).json({ success: false, error: 'Usuário já está ativo' });
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await UserRepository.setEmailValidationToken(id, token, expiresAt);
      await sendValidationEmail({ email: u.email, username: u.username, token });
      try { const { log } = require('../utils/auditLogger'); log('user.resend_validation', { id, email: u.email, actor: req.user || null }); } catch {}
      return res.json({ success: true, message: 'Reenviamos o email de confirmação. Verifique sua caixa de entrada e spam.' });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Erro ao reenviar validação', detail: err.message });
    }
  }
}

/*
  Envio de email de validação
  Parâmetros: `email`, `username`, `token`
  - Usa SMTP configurável (ou Gmail como fallback) e inclui preheader para melhores clientes.
  - Em ambientes sem SMTP, imprime link no console.
*/
async function sendValidationEmail({ email, username, token }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromAddr = process.env.SMTP_FROM || 'satasyst3m@gmail.com';
  const fromName = process.env.SMTP_FROM_NAME || 'SATA Sistema';
  const frontUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const safeFrontUrl = frontUrl.includes('localhost') ? frontUrl : frontUrl.replace(/^http:/, 'https:');
  const link = `${safeFrontUrl}/validate-email?token=${encodeURIComponent(token)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#1976d2">Validação de email</h2>
      <p>Olá ${username},</p>
      <p>Para concluir o cadastro, valide seu email clicando no botão abaixo. O link expira em 24 horas.</p>
      <p style="text-align:center;margin:30px 0">
        <a href="${link}" style="background:#1976d2;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Validar email</a>
      </p>
      <p>Se você não solicitou, ignore esta mensagem.</p>
      <hr/>
      <small>Equipe SATA</small>
    </div>
  `;
  if (smtpHost && smtpUser && smtpPass) {
    const secure = (process.env.SMTP_SECURE === 'true') || smtpPort === 465;
    const requireTLS = process.env.SMTP_REQUIRE_TLS === 'true';
    const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';
    let transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure, requireTLS, tls: { rejectUnauthorized }, auth: { user: smtpUser, pass: smtpPass } });
    try { await transporter.verify(); } catch (e) {
      if (String(smtpHost).includes('gmail.com')) {
        try {
          transporter = nodemailer.createTransport({ service: 'gmail', secure: false, auth: { user: smtpUser, pass: smtpPass } });
          await transporter.verify();
        } catch (e2) {
          throw e2;
        }
      } else {
        throw e;
      }
    }
    const preheader = `Valide seu email para ativar sua conta no SATA. O link expira em 24 horas.`;
    const html2 = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
        <h2 style="color:#1976d2;margin:0 0 16px">Confirmar endereço de email</h2>
        <p style="margin:0 0 12px">Olá ${username},</p>
        <p style="margin:0 0 16px">Para concluir seu cadastro no <strong>SATA</strong>, confirme seu email clicando no botão abaixo. Este link é válido por 24 horas.</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${link}" style="background:#1976d2;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block">Validar email</a>
        </p>
        <p style="margin:0 0 12px">Se você não solicitou esta confirmação, por favor ignore este email.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:12px;color:#666;margin:0">${fromName} · Sistema de Gestão · Suporte: ${fromAddr}</p>
      </div>
    `;
    await transporter.sendMail({
      from: `${fromName} <${fromAddr}>`,
      to: email,
      replyTo: fromAddr,
      subject: 'Confirme seu email | SATA',
      text: `Olá ${username},\n\nPara concluir seu cadastro no SATA, confirme seu email acessando o link (válido por 24 horas):\n${link}\n\nSe você não solicitou esta confirmação, ignore esta mensagem.\n\n${fromName}`,
      html: html2,
      headers: { 'X-Auto-Response-Suppress': 'All' }
    });
  } else {
    console.log('SMTP não configurado. Link de validação:', link);
  }
}

module.exports = new UsersController();