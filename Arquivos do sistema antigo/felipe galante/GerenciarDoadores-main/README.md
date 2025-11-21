# Gerenciar Doadores — Arquitetura MVC

## Estrutura de Pastas
- `BackEnd/`
  - `config/`
  - `controls/`
  - `di/`
  - `models/`
    - `repositories/`
    - `services/`
  - `routes/`
- `FrontEnd/`
  - `src/`
    - `views/`
    - `controls/`
    - `services/`

## Camadas
- Model: entidades, serviços e repositórios (acesso a dados e regras).
- View: componentes React (apresentação e UI).
- Control: orquestra requisições entre View e Model.

## Injeção de Dependências
- BackEnd: `di/container.js` instancia repositório, serviço e controla o roteamento.
- FrontEnd: `src/controls/container.js` compõe `DoadorController` com `doadorService`.

## Padrões de Projeto
- SOLID, Lei de Demeter e DRY aplicados nas camadas e dependências.

## Testes
- BackEnd: `npm test` (Jest) com cobertura mínima global 80% linhas/declarações.
- FrontEnd: `npm run test` (Vitest) com cobertura reportada via V8.

## Comandos
- BackEnd: `cd BackEnd && npm install && npm test`
- FrontEnd: `cd FrontEnd && npm install && npm run test`

## Guia de Migração
1. Controllers foram movidos para `BackEnd/controls` e usam `di/container.js`.
2. Repositório antigo foi substituído por `models/repositories/MySqlDoadorRepository.js`.
3. Serviço de domínio em `models/services/DoadorService.js` centraliza validações e regras.
4. FrontEnd: componentes migrados de `src/components` para `src/views`.
5. Consumo de API no FrontEnd agora passa por `src/controls/DoadorController.js`.
6. Atualize importações conforme o novo caminho das views e controls.

## Qualidade de Código
- Baixo acoplamento entre camadas e alta coesão por módulo.
- Interfaces explícitas (`IDoadorRepository`) e DI garantem testabilidade.