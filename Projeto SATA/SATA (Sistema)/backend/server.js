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

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

// Rotas de autenticação (sem proteção)
app.use('/api/auth', authRouters);

// Proteção global e controle de acesso por papel para demais rotas
app.use('/api', authenticate, roleAccessControl);

// Rotas
app.use('/api/idosos', idosoRouters);
app.use('/api/quartos', quartoRouters);
app.use('/api/internacoes', internacaoRouters);
app.use('/api/doacoes', doacaoRouters);
app.use('/api/doadores', doadorRouters);
app.use('/api/eventos', eventoRouters);
app.use('/api/financeiro', financeiroRouters);
app.use('/api/produtos', produtoRouters);
app.use('/api/notificacoes', notificacaoRouters);

app.get('/', (req, res) => {
    res.json({ message: 'API de Sistema de Asilo funcionando!' });
});

// Bind explícito em 0.0.0.0 para evitar problemas de acesso em ambientes de preview
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});