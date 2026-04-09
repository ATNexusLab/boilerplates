# @atnexuslab/create-app

CLI interativo para criar projetos com os boilerplates da ATNexusLab.

## Uso

```bash
npx @atnexuslab/create-app
```

O CLI guia você passo a passo:

```
🚀 @atnexuslab/create-app

? Qual o nome do projeto?        my-app
? Qual tipo de projeto?           Backend / Frontend / Fullstack / Mobile
? Qual framework?                 (filtrado pelo tipo)
? Qual gerenciador de pacotes?    npm / Bun / pnpm / Yarn
? Qual linter/formatter?          Prettier + ESLint / Biome
? Incluir Better Auth?            Sim / Não
? Incluir Docker?                 Sim / Não
? Incluir GitHub Actions CI?      Sim / Não
? Instalar dependências agora?    Sim / Não
```

Após a criação, o CLI automaticamente:
- Inicializa um repositório git com commit inicial
- Oferece instalação de dependências

## CLI Options

```bash
npx @atnexuslab/create-app --help     # Exibe ajuda
npx @atnexuslab/create-app --version  # Exibe versão
```

## Frameworks Disponíveis

| Framework      | Tipo       | npm | Bun | pnpm | Yarn | Better Auth | Docker |
|---------------|------------|-----|-----|------|------|-------------|--------|
| ElysiaJS      | Backend    | ✗   | ✓   | ✗    | ✗    | ✓           | ✓      |
| ExpressJS     | Backend    | ✓   | ✓   | ✓    | ✓    | ✓           | ✓      |
| React + Vite  | Frontend   | ✓   | ✓   | ✓    | ✓    | ✗           | ✓      |
| Vue + Vite    | Frontend   | ✓   | ✓   | ✓    | ✓    | ✗           | ✓      |
| Next.js       | Fullstack  | ✓   | ✓   | ✓    | ✓    | ✓           | ✓      |
| Vinext        | Fullstack  | ✓   | ✓   | ✓    | ✓    | ✓           | ✓      |
| Flutter       | Mobile     | ✗   | ✗   | ✗    | ✗    | ✗           | ✓      |
| React Native  | Mobile     | ✓   | ✓   | ✓    | ✓    | ✗           | ✗      |

## O que vem incluso

### Backend (Express, ElysiaJS)

Estrutura modular production-ready:

```
src/
├── server.ts           # HTTP server + graceful shutdown
├── app.ts              # App config (middlewares, routes)
├── config/
│   └── env.ts          # Environment variables tipadas
├── routes/
│   ├── index.ts        # Router principal
│   └── health.ts       # GET /health
├── middlewares/
│   ├── error-handler.ts
│   └── not-found.ts
└── lib/
    └── logger.ts
```

Inclui: `.env.example`, CORS, Helmet, compression, health check, graceful shutdown, error handling centralizado.

### Frontend (React, Vue)

- Path alias `@/` configurado (Vite + TypeScript)
- `.env.example` com variáveis Vite
- Meta tags SEO e favicon
- Error Boundary (React)

### Fullstack (Next.js, Vinext)

- `.env.example`
- Páginas de erro customizadas (`error.tsx`, `not-found.tsx`)
- Next.js com `output: "standalone"` e `poweredByHeader: false`

### Todos os templates

- `.editorconfig` com padrões consistentes
- `.gitignore` com `.env*` patterns
- TypeScript strict mode
- README com instruções de setup

## Tooling

- **Prettier + ESLint** — Combo tradicional de linting e formatação
- **Biome** — Linter + formatter all-in-one (substitui ESLint e Prettier)
- **Better Auth** — Autenticação pronta para frameworks backend/fullstack
- **Docker** — Dockerfile multi-stage + docker-compose com healthcheck e restart policy
- **GitHub Actions CI** — Workflow de CI com detecção automática de package manager (lint + build)

## Desenvolvimento

```bash
git clone https://github.com/ATNexusLab/boilerplates.git
cd boilerplates
npm install
npm run build
node dist/index.js
```

## Licença

MIT © [NCC - Nexus Computer Club](https://github.com/ATNexusLab)
