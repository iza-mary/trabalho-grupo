# Documento de Arquitetura – GerenciarDoadores-main

- Artefato: Documento de Arquitetura de Software (IEEE 1016)
- Versão do documento: 1.0.0
- Data: 2025-11-11
- Ferramentas e versões: PlantUML 1.2024.6 (target), Node.js (>=18), Express 5.1.0, CORS 2.8.5, mysql2 3.6+, Graphviz (opcional para PlantUML), Astah (import via XMI 2.1)
- Projeto: GerenciarDoadores-main (Backend)

## 1. Propósito e Escopo (IEEE 1016)
- Propósito: Documentar a arquitetura do backend do GerenciarDoadores, destacando estrutura MVC, componentes, fluxos e decisões.
- Escopo: Módulo Doador (Model, Repository, Controller, Route, Application, Config); banco de dados MySQL externo.
- Público: Desenvolvedores, Arquitetos de Software, QA.

## 2. Contexto e Visão Geral
- Estilo arquitetural: MVC clássico adaptado para API REST no backend (View materializada como respostas JSON).
- Principais camadas: Model (Doador), Repository (DoadorRepository), Controller (DoadorController), Route (DoadorRoutes), Application (ServerApp), Config (DatabasePool).
- Dependência externa: MySQL via mysql2 (pool/conexão), CORS para cross-origin.

## 3. Visões Arquiteturais

### 3.1. Diagrama de Classes (UML 2.0)
- Fonte: `BackEnd/docs/diagrama-classes.puml`
- Organização em pacotes por camada (Model, Repository, Controller, Route, Application, Config, View).
- Convenções: `+` público, `-` privado, `#` protegido; associação `--`, composição `*--`, herança `<|--`.
- Notas de responsabilidade nas classes: modelagem de domínio (Doador), persistência (DoadorRepository), orquestração REST (DoadorController), roteamento (DoadorRoutes), inicialização (ServerApp), conexão (DatabasePool), resposta (JsonResponse).
 - Estereótipos: `DoadorRepository` marcado como `<<DAO>>` para explicitar o padrão DAO/Repository.

### 3.2. Diagrama de Componentes (UML 2.0)
- Fonte: `BackEnd/docs/diagrama-componentes.puml`
- Camadas lógicas com interfaces provided/required (IHTTP, IControllerAPI, IRepositoryAPI, IDataModel, IDBPool, IHTTPReq, IQueryExec).
- Fluxo: `Application -> Route -> Controller -> Repository -> Model/DB`.

### 3.3. Diagrama de Sequência (UML 2.0)
- Fonte: `BackEnd/docs/diagrama-sequencia.puml`
- Cenários: criar doador, obter por id, buscar por texto.
- Participantes: Client, Route, Controller, Repository, Database.

## 4. Mapeamento MVC (Gang of Four)
- Model: `Doador` — encapsula dados e validação; representa domínio.
- View: `JsonResponse` (boundary) — respostas HTTP JSON geradas pelo Controller (View não é camada explícita no backend, é materializada pela serialização e envio de `res.json`).
- Controller: `DoadorController` — coordena entrada/saída, delega ao Repository.
- Roteamento: `DoadorRoutes` — não pertence ao GoF MVC original, mas organiza endpoints REST.
- Persistência: `DoadorRepository` — separa o acesso a dados do Controller.
- Aplicação/Config: `ServerApp`, `DatabasePool` — infraestrutura (inicialização, conexões).

## 5. Avaliação da Separação de Preocupações
- Positivos:
  - Controller não faz SQL direto; delega ao Repository.
  - Model possui validação/coerência de dados (validate, toJSON).
  - Rotas mapeiam endpoints e isolam a camada HTTP.
- Pontos de atenção:
  - View não é explicitamente separada (res.json dentro do Controller) — adequado ao estilo REST, mas pode dificultar testes isolados de apresentação.
  - Repository acopla SQL a estrutura atual do schema (baixo acoplamento ao Model, porém dependente do banco).
  - Falta tipagem forte (JS puro) e DTOs para fronteira (req/res).

## 6. Pontos de Acoplamento Críticos
- Controller ↔ Repository: contrato de métodos (CRUD, busca) — risco se mudar assinaturas.
- Repository ↔ DB (mysql2): dependência de schema e sintaxe — alterações de banco impactam o repositório.
- Controller ↔ Rotas: endpoints e parâmetros — mudanças de paths ou validações impactam ambos.

## 7. Recomendações de Refatoração (Prioritizadas)
1) Introduzir camada de serviço (Service) entre Controller e Repository para regras de negócio e orquestração.
2) Adicionar DTOs/validações (ex: `zod`/`yup`) para entrada/saída; melhorar contratos.
3) Isolar configuração do pool e parâmetros sensíveis via `.env` e módulo Config central.
4) Adotar tipagem (TypeScript) para reduzir erros e documentar contratos.
5) Implementar testes (unitários em Model/Repository; integração para Controller/Rotas).

## 8. Sugestões para Escalabilidade
- Conexões: monitorar pool, circuit breaker em falhas de DB, retry/backoff.
- Cache para leitura (ex: resultados de busca paginados).
- Paginação e filtros indexados no DB.
- Observabilidade: logs estruturados, métricas (tempo de resposta, erros por endpoint).
- Desacoplamento por interfaces (Service/Repository) para troca de banco.

## 9. Requisitos Técnicos e Consistência
- Ferramenta UML: PlantUML 1.2024.6 (target) com Graphviz.
- Notação consistente nos diagramas: classes, componentes, sequência.
- Metadados de versão em cada artefato (`title` e cabeçalho com Version/Date/Tool).
- Convenções de nomenclatura: CamelCase para classes; nomes descritivos para interfaces.

## 10. Referências e Artefatos
- Classes: `BackEnd/docs/diagrama-classes.puml`.
- Componentes: `BackEnd/docs/diagrama-componentes.puml`.
- Sequência: `BackEnd/docs/diagrama-sequencia.puml`.
- XMI (Astah): `BackEnd/docs/diagrama-classes-astah.xmi`, `BackEnd/docs/diagrama-componentes-astah.xmi`.
- Código-fonte de domínio: `BackEnd/models/doador.js`.

## 11. Histórico de Revisões
- 1.0.0 (2025-11-11): Versão inicial completa (classes, componentes, sequência, análise MVC, avaliação).