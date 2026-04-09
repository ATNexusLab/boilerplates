# {{PROJECT_NAME}}

Built with [ElysiaJS](https://elysiajs.com/) + [Bun](https://bun.sh/).

## Getting Started

```bash
bun install
bun dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── server.ts           # HTTP server + graceful shutdown
├── app.ts              # Elysia app (plugins, routes)
├── config/
│   └── env.ts          # Environment variables
├── routes/
│   ├── index.ts        # Root router
│   └── health.ts       # GET /health
├── middlewares/
│   └── error-handler.ts
└── lib/
    └── logger.ts
```

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

## Scripts

| Command         | Description              |
|----------------|--------------------------|
| `bun dev`      | Start dev server (HMR)   |
| `bun run build`| Build for production      |
| `bun start`    | Run production build      |
