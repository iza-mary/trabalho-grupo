# Documentação e Reprodutibilidade – GerenciarDoadores-main

- Artefato: README de Documentação
- Versão: 1.0.0
- Data: 2025-11-11

## Conteúdo
- Diagrama de Classes (PlantUML): `BackEnd/docs/diagrama-classes.puml`
- Diagrama de Componentes (PlantUML): `BackEnd/docs/diagrama-componentes.puml`
- Diagrama de Sequência (PlantUML): `BackEnd/docs/diagrama-sequencia.puml`
- Documento analítico (IEEE 1016): `BackEnd/docs/arquitetura-completa.md`
- Metadados de versões: `BackEnd/docs/versoes.md`
- XMI para Astah: `BackEnd/docs/diagrama-classes-astah.xmi`, `BackEnd/docs/diagrama-componentes-astah.xmi`

## Dependências
- Java Runtime + PlantUML (1.2024.6 recomendado)
- Graphviz (opcional, melhora layout)
- Alternativas de visualização: VSCode PlantUML, IntelliJ PlantUML, PlantUML Server
- Para gerar PDF (opcional): `pandoc` ou export pelos editores

## Como Renderizar os Diagramas
- Via VSCode Plugin PlantUML: abrir `.puml` e usar preview/export.
- Via CLI (exemplo, se plantuml.jar disponível):
  - `java -jar plantuml.jar BackEnd/docs/diagrama-classes.puml`
  - `java -jar plantuml.jar BackEnd/docs/diagrama-componentes.puml`
  - `java -jar plantuml.jar BackEnd/docs/diagrama-sequencia.puml`

## Como Gerar o PDF
- Opção 1 (Pandoc):
  - `pandoc BackEnd/docs/arquitetura-completa.md -o BackEnd/docs/arquitetura-completa.pdf`
- Opção 2 (Export por editor):
  - Exportar imagens dos `.puml` e montar o PDF no editor/IDE.

## Escopo do Código-fonte Anexado
- Apenas classes de domínio (Model). Incluído: `BackEnd/models/doador.js`.

## Histórico de Versões
- 1.0.0 (2025-11-11) – Primeira versão com diagramas (classes, componentes, sequência), XMI, documento analítico, metadados.