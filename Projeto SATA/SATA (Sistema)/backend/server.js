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

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Configuração de middlewares base (CORS, parsing JSON e cookies)
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
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

// Rotas públicas: autenticação e sessão
app.use('/api/auth', authRouters);

// Endpoint utilitário: validação de email (antes da proteção global)
app.get('/api/users/validate-email', (req, res) => usersController.validateEmail(req, res));

// Proteção global: requer JWT válido e aplica controle de acesso por papel
app.use('/api', authenticate, roleAccessControl);

// Módulos de domínio
app.use('/api/idosos', idosoRouters);
app.use('/api/quartos', quartoRouters);
app.use('/api/internacoes', internacaoRouters);
app.use('/api/doacoes', doacaoRouters);
app.use('/api/doadores', doadorRouters);
app.use('/api/eventos', eventoRouters);
app.use('/api/financeiro', financeiroRouters);
app.use('/api/produtos', produtoRouters);
app.use('/api/notificacoes', notificacaoRouters);
app.use('/api/estoque/doacoes', estoqueDonationRouters);
app.use('/api/nomes', nomeUpdateRouters);
app.use('/api/users', usersRouters);

// Saúde da API: útil para monitoramento e testes rápidos
app.get('/', (req, res) => {
    res.json({ message: 'API de Sistema de Asilo funcionando!' });
});

// Documentação interativa (Swagger)
mountSwagger(app);

// Inicialização do servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    db.testConnection().catch(err => console.error('Falha na verificação do banco:', err.message));
});
