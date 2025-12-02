/*
  Finalidade
  - Configura e inicializa o servidor HTTP da API SATA usando Express.
  - Centraliza middlewares, proteção (JWT + controle de papel), e montagem das rotas de domínio.
  - Expõe documentação via Swagger e realiza verificação básica de conexão com banco ao iniciar.

  Padrões de comentário
  - Comentários de bloco explicam propósito e decisões.
  - Comentários de linha destacam pontos de atenção e limitações.
*/
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { authenticate, roleAccessControl } = require('./middleware/authMiddleware');
const idosoRouters = require('./routers/idosoRouters');
const quartoRouters = require('./routers/quartoRouters');
const internacaoRouters = require('./routers/internacaoRouters');
const doacaoRouters = require('./routers/doacaoRouters');
const doadorRouters = require('./routers/doadorRouters');
const eventoRouters = require('./routers/eventoRouters');
const financeiroRouters = require('./routers/financeiroRouters');
const produtoRouters = require('./routers/produtoRouters');
const notificacaoRouters = require('./routers/notificacaoRouters');
const authRouters = require('./routers/authRouters');
const usersRouters = require('./routers/usersRouters');
const usersController = require('./controllers/usersController');
const estoqueDonationRouters = require('./routers/estoqueDonationRouters');
const nomeUpdateRouters = require('./routers/nomeUpdateRouters');
const db = require('./config/database');
const { mountSwagger } = require('./swagger');
const MovimentoEstoqueRepository = require('./repository/movimentoEstoqueRepository');

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const DONATION_SLA_MS = 2000;
const donationMetrics = {
  count: 0,
  totalMs: 0,
  maxMs: 0,
  breaches: 0,
  last10: []
};
function donationTimingMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    donationMetrics.count += 1;
    donationMetrics.totalMs += durationMs;
    if (durationMs > donationMetrics.maxMs) donationMetrics.maxMs = durationMs;
    donationMetrics.last10.push(durationMs);
    if (donationMetrics.last10.length > 10) donationMetrics.last10.shift();
    const avgMs = donationMetrics.totalMs / donationMetrics.count;
    const breach = durationMs > DONATION_SLA_MS;
    if (breach) donationMetrics.breaches += 1;
  });
  next();
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowList = ['http://localhost:5173', 'http://localhost:5174'];
        if (process.env.CORS_ORIGIN) allowList.push(process.env.CORS_ORIGIN);
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
        if (allowList.includes(origin) || isLocalhost) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());
/*
  Proteção CSRF simplificada
  - Ignora métodos de leitura (GET/OPTIONS) e as rotas públicas de auth.
  - Compara cabeçalho 'x-csrf-token' com cookie 'csrf_token' quando presente.
  - Limitação: abordagem básica; idealmente integrar com biblioteca dedicada se necessário.
*/
function csrfGuard(req, res, next) {
    const m = req.method;
    if (m === 'GET' || m === 'OPTIONS') return next();
    if (req.path && req.path.startsWith('/api/auth')) return next();
    const c = (req.cookies && req.cookies.csrf_token) || null;
    if (!c) return next();
    const h = req.headers['x-csrf-token'] || null;
    if (!h || h !== c) {
        return res.status(403).json({ success: false, error: 'CSRF token inválido' });
    }
    next();
}
app.use(csrfGuard);

app.use('/api/auth', authRouters);

app.get('/api/users/validate-email', (req, res) => usersController.validateEmail(req, res));

app.use('/api', authenticate, roleAccessControl);

const sseClients = new Set();
function sseBroadcast(event, data) {
  const payload = JSON.stringify(data);
  for (const res of sseClients) {
    try { res.write(`event: ${event}\n` + `data: ${payload}\n\n`); } catch (_) {}
  }
}
app.get('/api/notificacoes/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();
  sseClients.add(res);
  req.on('close', () => { sseClients.delete(res); });
  try { res.write(`event: ping\n` + `data: "ready"\n\n`); } catch (_) {}
});

app.use('/api/idosos', idosoRouters);
app.use('/api/quartos', quartoRouters);
app.use('/api/internacoes', internacaoRouters);
app.use('/api/doacoes', donationTimingMiddleware, doacaoRouters);
app.use('/api/doadores', doadorRouters);
app.use('/api/eventos', eventoRouters);
app.use('/api/financeiro', financeiroRouters);
app.use('/api/produtos', produtoRouters);
app.use('/api/notificacoes', notificacaoRouters);
app.use('/api/estoque/doacoes', estoqueDonationRouters);
app.use('/api/nomes', nomeUpdateRouters);
app.use('/api/users', usersRouters);

app.get('/', (req, res) => {
    res.json({ message: 'API de Sistema de Asilo funcionando!' });
});

app.get('/api/_metrics/donations', (req, res) => {
  const avgMs = donationMetrics.count ? (donationMetrics.totalMs / donationMetrics.count) : 0;
  res.json({
    success: true,
    data: {
      count: donationMetrics.count,
      avg_ms: Number(avgMs.toFixed(2)),
      max_ms: Number(donationMetrics.maxMs.toFixed(2)),
      sla_ms: DONATION_SLA_MS,
      breaches: donationMetrics.breaches,
      last10_ms: donationMetrics.last10.map(v => Number(v.toFixed(2)))
    }
  });
});

// Documentação interativa (Swagger)
mountSwagger(app);

// Inicialização do servidor com verificação de banco antes de subir
(async () => {
    try {
        await db.testConnection();
        await MovimentoEstoqueRepository.ensureTable();
    } catch (e) {
        console.error('Falha na inicialização do banco:', e.message);
        process.exitCode = 1;
        return;
    }

    let lastNotifId = 0;
    try {
      const [r] = await db.query('SELECT MAX(id) AS maxId FROM notificacoes');
      lastNotifId = Number(r?.[0]?.maxId || 0);
    } catch (_) {}
    setInterval(async () => {
      try {
        const [rows] = await db.query('SELECT * FROM notificacoes WHERE id > ? ORDER BY id ASC', [lastNotifId]);
        if (Array.isArray(rows) && rows.length) {
          lastNotifId = rows[rows.length - 1].id;
          sseBroadcast('new', rows);
        }
      } catch (_) {}
    }, 1000);
    setInterval(() => { sseBroadcast('ping', Date.now()); }, 30000);

    require('./scheduler');

    app.listen(port, '0.0.0.0', () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
})();
