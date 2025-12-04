/*
  Finalidade
  - Configura e inicializa o servidor HTTP da API SATA usando Express.
  - Centraliza middlewares, proteção (JWT + controle de papel), e montagem das rotas de domínio.
  - Expõe documentação via Swagger e realiza verificação básica de conexão com banco ao iniciar.

  Padrões de comentário
  - Comentários de bloco explicam propósito e decisões.
  - Comentários de linha destacam pontos de atenção e limitações.
*/
const { app, init } = require('./app');
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Middleware de medição é definido em app.js

// Inicialização e start local
(async () => {
  await init(false);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
})();
