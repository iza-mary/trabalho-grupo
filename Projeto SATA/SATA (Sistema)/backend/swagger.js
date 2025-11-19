const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SATA API',
      version: '1.0.0',
      description: 'Documentação dos endpoints de gerenciamento de perfis e autenticação.'
    },
    servers: [
      { url: 'http://localhost:3000/api' }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth_token'
        }
      }
    },
    security: [{ cookieAuth: [] }]
  },
  apis: []
};

const swaggerSpec = swaggerJSDoc(options);
swaggerSpec.paths = swaggerSpec.paths || {};
swaggerSpec.paths['/users'] = {
  get: {
    summary: 'Listar usuários',
    parameters: [
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['ativo','inativo'] } },
      { name: 'role', in: 'query', schema: { type: 'string', enum: ['Admin','Funcionário'] } },
      { name: 'page', in: 'query', schema: { type: 'integer' } },
      { name: 'pageSize', in: 'query', schema: { type: 'integer' } }
    ],
    responses: { 200: { description: 'OK' } }
  },
  post: {
    summary: 'Criar usuário',
    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } }, required: ['username','email'] } } } },
    responses: { 201: { description: 'Criado' } }
  }
};
swaggerSpec.paths['/users/{id}'] = {
  put: {
    summary: 'Atualizar usuário',
    parameters: [{ name: 'id', in: 'path', schema: { type: 'integer' }, required: true }],
    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } } } } } },
    responses: { 200: { description: 'OK' } }
  },
  delete: {
    summary: 'Excluir usuário',
    parameters: [{ name: 'id', in: 'path', schema: { type: 'integer' }, required: true }],
    responses: { 200: { description: 'OK' } }
  }
};
swaggerSpec.paths['/users/{id}/status'] = {
  patch: {
    summary: 'Alterar status do usuário',
    parameters: [{ name: 'id', in: 'path', schema: { type: 'integer' }, required: true }],
    requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['ativo','inativo'] } }, required: ['status'] } } } },
    responses: { 200: { description: 'OK' } }
  }
};
swaggerSpec.paths['/users/validate-email'] = {
  get: {
    summary: 'Validar email por token',
    parameters: [{ name: 'token', in: 'query', schema: { type: 'string' }, required: true }],
    responses: { 200: { description: 'OK' } }
  }
};
swaggerSpec.paths['/users/{id}/resend-validation'] = {
  post: {
    summary: 'Reenviar email de validação',
    parameters: [{ name: 'id', in: 'path', schema: { type: 'integer' }, required: true }],
    responses: { 200: { description: 'OK' }, 429: { description: 'Rate limit' } }
  }
};

function mountSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = { mountSwagger };
/*
  Swagger (OpenAPI)
  - Gera e monta documentação interativa para a API em `/api/docs`.
*/