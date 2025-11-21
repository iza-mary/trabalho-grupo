# FrontEnd — Estrutura MVC

- Views: `src/views/*`
- Controls: `src/controls/*`
- Services: `src/services/*`

## Testes (Vitest)
- Executar: `npm run test`
- Cobertura: gerada via V8

## Migração
- Componentes foram movidos de `src/components` para `src/views`.
- Use `src/controls/container.js` para obter o `doadorController`.
