# @atnexuslab/create-app

CLI interativo para criar projetos production-ready com os boilerplates da ATNexusLab.

## Uso

```bash
npx @atnexuslab/create-app
```

O CLI guia você passo a passo com perguntas encadeadas baseadas no tipo de projeto:

```
🚀 @atnexuslab/create-app

? Qual o nome do projeto?        my-app
? Qual tipo de projeto?           Backend / Frontend / Fullstack / Mobile
? Qual framework de API?          Express / ElysiaJS / Flask / FastAPI / Django
? Banco de dados?                 Nenhum / PostgreSQL / MySQL / MongoDB
? ORM?                            Nenhum / Prisma / Drizzle / SQLAlchemy
? Cache?                          Nenhum / Redis
? Qual gerenciador de pacotes?    npm / bun / pnpm / yarn / pip / poetry / uv
? Qual linter/formatter?          Prettier + ESLint / Biome / Ruff
? Incluir autenticação?           Sim / Não
? Incluir Docker?                 Sim / Não
? Incluir GitHub Actions CI?      Sim / Não
```

As opções são filtradas automaticamente — por exemplo:
- **Python** (Flask/FastAPI/Django): ORM mostra SQLAlchemy, linter é Ruff, PM é pip/poetry/uv
- **JS/TS** (Express/ElysiaJS): ORM mostra Prisma/Drizzle, linter é ESLint+Prettier/Biome
- **Django**: pula a pergunta de ORM (usa o próprio)
- **MongoDB + Drizzle**: combinação não oferecida (sem suporte)

Após a criação, o CLI automaticamente:
- Inicializa um repositório git com commit inicial
- Oferece instalação de dependências (JS/TS)
- Mostra os próximos passos

## CLI Options

```bash
npx @atnexuslab/create-app --help     # Exibe ajuda
npx @atnexuslab/create-app --version  # Exibe versão
```

## Frameworks Disponíveis

### Backend (API)

| Framework  | Linguagem  | Package Managers   | Auth            | Docker |
|-----------|------------|-------------------|-----------------|--------|
| Express   | TypeScript | npm/bun/pnpm/yarn | Better Auth     | ✓      |
| ElysiaJS  | TypeScript | bun               | Better Auth     | ✓      |
| Flask     | Python     | pip/poetry/uv     | Flask-Login     | ✓      |
| FastAPI   | Python     | pip/poetry/uv     | FastAPI Security| ✓      |
| Django    | Python     | pip/poetry/uv     | Django Auth     | ✓      |

### Frontend (Web)

| Framework      | Package Managers   | Docker |
|---------------|-------------------|--------|
| React + Vite  | npm/bun/pnpm/yarn | ✓      |
| Vue + Vite    | npm/bun/pnpm/yarn | ✓      |
| Next.js       | npm/bun/pnpm/yarn | ✓      |
| Vinext        | npm/bun/pnpm/yarn | ✓      |

### Mobile

| Framework      | Package Managers   |
|---------------|-------------------|
| Flutter       | (Dart/Flutter CLI) |
| React Native  | npm/bun/pnpm/yarn |

### Banco de Dados + ORM

| Database   | JS/TS ORMs      | Python ORM  | Docker Service |
|-----------|----------------|-------------|----------------|
| PostgreSQL | Prisma, Drizzle | SQLAlchemy  | postgres:16    |
| MySQL      | Prisma, Drizzle | SQLAlchemy  | mysql:8        |
| MongoDB    | Prisma          | —           | mongo:7        |

### Cache

| Cache | JS/TS          | Python  | Docker Service |
|-------|---------------|---------|----------------|
| Redis | ioredis       | redis   | redis:7        |

## O que vem incluso

### Backend JS/TS (Express, ElysiaJS)

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

### Backend Python (Flask, FastAPI, Django)

Estrutura modular com separação server/app:

```
src/
├── server.py           # Entry point (gunicorn/uvicorn)
├── app.py              # App factory / FastAPI instance
├── config/
│   └── settings.py     # Settings via dataclass/Pydantic/Django
├── routes/
│   └── health.py       # GET /health
└── lib/
    └── logger.py       # Logging configurado
```

Django usa estrutura própria com `config/` (settings, urls, wsgi, asgi) e `apps/`.

Inclui: `.env.example`, CORS, health check, structured logging, error handling.

### Frontend (React, Vue)

- Path alias `@/` configurado (Vite + TypeScript)
- `.env.example` com variáveis Vite
- Meta tags SEO e favicon
- Error Boundary (React)

### Fullstack (Next.js, Vinext)

- `.env.example`
- Páginas de erro customizadas (`error.tsx`, `not-found.tsx`)
- Next.js com `output: "standalone"` e `poweredByHeader: false`

### Fullstack (combinação Backend + Frontend)

Quando o tipo é **Fullstack**, o CLI pergunta tanto o backend quanto o frontend e gera um monorepo:

```
my-app/
├── apps/
│   ├── api/       # Backend (Express/Flask/etc)
│   └── web/       # Frontend (React/Vue/etc)
├── .editorconfig
├── .gitignore
├── package.json   # Workspaces (JS/TS)
└── README.md
```

### Mobile (Flutter, React Native)

O CLI também suporta projetos mobile. Quando a plataforma é **both** (web + mobile), gera monorepo com `apps/web/` e `apps/mobile/`.

### Todos os templates

- `.editorconfig` com padrões consistentes (2 spaces JS/TS, 4 spaces Python)
- `.gitignore` com `.env*` patterns
- TypeScript strict mode (JS/TS)
- README com instruções de setup

## Tooling

### Linting & Formatação

- **Prettier + ESLint** — Combo tradicional (JS/TS)
- **Biome** — Linter + formatter all-in-one (JS/TS)
- **Ruff** — Linter + formatter para Python (auto-selecionado)

### Autenticação

- **Better Auth** — Para frameworks JS/TS (Express, ElysiaJS)
- **Flask-Login** — Para Flask
- **FastAPI Security** — JWT + OAuth2 para FastAPI
- **Django Auth** — Custom User model para Django

### Infraestrutura

- **Docker** — Dockerfile otimizado + docker-compose com healthcheck e restart policy
- **Docker Compose** — Gera automaticamente serviços de DB e cache quando selecionados
- **GitHub Actions CI** — Workflow com detecção automática de package manager

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
