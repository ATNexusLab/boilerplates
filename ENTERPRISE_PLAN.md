# Enterprise Upgrade Plan

## Background & Motivation
O repositório base carecia de recursos cruciais para ser considerado "Enterprise Senior". Não possuía frameworks de testes configurados, a segurança (rate limit, cors estrito) estava ausente ou incompleta em alguns frameworks, e faltava logging estruturado (ex: Pino, Structlog). O usuário optou pela abordagem "Enterprise By Default", onde esses recursos são incorporados diretamente aos templates base para uso imediato (sem arquivos de teste de exemplo, focando apenas no setup de dependências, scripts e CI/CD), usando a suíte nativa do Bun quando o PM escolhido for o Bun.

## Scope & Impact
- **Templates JS/TS (`express`, `nextjs`, `react`, `vue`, `vinext`)**:
  - Inclusão do `vitest` (para Node-based) e configuração do script `"test": "vitest run"`.
  - Atualização do `scaffold.ts` para que, se o package manager selecionado for `bun`, o script de teste seja alterado para `"test": "bun test"` e a dependência do `vitest` seja removida.
  - Logging estruturado: Inclusão do `pino` e criação de `src/lib/logger.ts`.
- **ElysiaJS**: Inclusão de `"test": "bun test"` no `package.json`, além de `@elysiajs/rate-limit` e logging.
- **Templates Python (`fastapi`, `flask`, `django`)**: Inclusão de `pytest`, `pytest-asyncio` nas deps de desenvolvimento. Inclusão de `structlog` para logging JSON. Adição de rate-limiting (e.g., `slowapi`, `Flask-Limiter`, `django-ratelimit`).
- **CI/CD**: Atualização do `.github/workflows/main.yml` (no overlay `github-actions`) para conter steps dinâmicos que executam linters e os testes recém configurados.

## Implementation Steps

### 1. Testes Base (Package & CI)
- **JS/TS (Base)**:
  - Adicionar `"test": "vitest run"` no campo `scripts` dos `package.json` de todos os JS/TS (exceto Elysia).
  - Adicionar `"vitest": "^3.0.0"` em `devDependencies`.
- **ElysiaJS**:
  - Adicionar `"test": "bun test"` no campo `scripts`.
- **Python (Base)**:
  - Adicionar `pytest`, `pytest-asyncio` aos arrays de dev em `pyproject.toml` (FastAPI/Flask) ou `requirements-dev.txt` (Django).
- **Scaffold.ts (Integração com Bun)**:
  - No `handlePostScaffold` (ou step similar), implementar um hook que: caso o `packageManager` seja `bun`, acesse o `package.json` gerado, troque `"test": "vitest run"` por `"test": "bun test"` e remova o `vitest` das `devDependencies`.

### 2. Segurança Hardening
- **Express**:
  - Adicionar `"express-rate-limit": "^7.5.0"` nas dependências.
  - No `src/app.ts`, instanciar e aplicar o limiter de forma global. Ajustar `cors` para ser mais restrito onde aplicável.
- **ElysiaJS**:
  - Adicionar `"@elysiajs/rate-limit": "^1.2.0"`, `"@elysiajs/cors": "^1.2.0"`.
  - No `src/app.ts`, usar os middlewares `.use(cors())` e `.use(rateLimit())`.
- **FastAPI**:
  - Adicionar `"slowapi": "^0.1.9"` ao `pyproject.toml`.
  - Configurar `Limiter` global no `app.py`.
- **Flask**:
  - Adicionar `"Flask-Limiter": "^3.11.0"` ao `pyproject.toml`.
  - Configurar `Limiter` global no `app.py`.
- **Django**:
  - Adicionar `"django-ratelimit": "^4.1.0"` e garantir `"django-cors-headers"`.
  - Integrar os middlewares em `settings.py`.

### 3. Structured Logging
- **JS/TS**:
  - Adicionar `"pino": "^9.0.0"` e `"pino-http": "^10.0.0"` aos templates backend TS.
  - Criar `src/lib/logger.ts` instanciando o Pino.
  - Substituir `console.log` por `logger.info` e plugar `pino-http` no Express.
- **Python**:
  - Adicionar `"structlog": "^25.1.0"`.
  - Atualizar `src/lib/logger.py` em FastAPI/Flask e configurações de logging do Django para usar Structlog.

### 4. CI/CD Atualizado
- Modificar `templates/overlays/github-actions/.github/workflows/main.yml` (ou ci.yml):
  - Inserir um step genérico de testes: `npm run test` (se tiver package.json) ou `pytest` (se for Python).

## Verification
- Ao final, geraremos três projetos teste (um Express com NPM, um ElysiaJS com Bun, um FastAPI com UV) e verificaremos se:
  - O script de teste de todos funciona corretamente sem quebrar (mesmo sem testes, apenas retornando sucesso ou avisando ausência).
  - O rate limiting funciona (HTTP 429).
  - O logger emite output JSON.
  - As Actions de CI passam a procurar a etapa de teste.