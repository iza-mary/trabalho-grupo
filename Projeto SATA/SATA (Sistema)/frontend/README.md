# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Notas sobre testes

Este projeto teve todos os testes e configurações de testes removidos para simplificar o bundle e reduzir dependências. Caso precise reativar testes no futuro:
- E2E: restaurar Playwright a partir de `__backup_removed__/frontend/playwright.config.js` e os arquivos em `__backup_removed__/frontend/tests/e2e`.
- Unitários: restaurar arquivos de `__backup_removed__/frontend/src/__tests__` e `__backup_removed__/frontend/src/test/setup.js`, além de reinstalar `vitest`, `@testing-library/react`, `@testing-library/user-event` e `jsdom`.

Após restaurar, reintroduza os scripts `test`, `test:ui` e `test:e2e` no `package.json` conforme necessário.
