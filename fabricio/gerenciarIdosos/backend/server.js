const express = require('express');
const cors = require('cors');
const idosoRouters = require('./routers/idosoRouters');
const quartoRouters = require('./routers/quartoRouters');
const internacaoRouters = require('./routers/internacaoRouters');

const app = express();
const port = 3000;

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Rotas
app.use('/api/idosos', idosoRouters);
app.use('/api/quartos', quartoRouters);
app.use('/api/internacoes', internacaoRouters);

app.get('/', (req, res) => {
    res.json({ message: 'API de Sistema de Asilo funcionando!' });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});