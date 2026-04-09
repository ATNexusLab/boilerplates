# {{PROJECT_NAME}}

Built with [Express](https://expressjs.com/) + TypeScript.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── server.ts           # HTTP server + graceful shutdown
├── app.ts              # Express app (middlewares, routes)
├── config/
│   └── env.ts          # Environment variables
├── routes/
│   ├── index.ts        # Root router
│   └── health.ts       # GET /health
├── middlewares/
│   ├── error-handler.ts
│   └── not-found.ts
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
| `npm run dev`  | Start dev server (watch) |
| `npm run build`| Build for production     |
| `npm start`    | Run production build     |
