const express = require('express');
const cors = require('cors');
const quartosRoutes = require('./routes/quartosRoutes');

const app = express();
const PORT = 3001;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Rotas principais da API
app.use('/api/quartos', quartosRoutes);

// Rota base (teste rápido)
app.get('/', (req, res) => {
  res.json({ message: 'API de Quartos funcionando corretamente!' });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});