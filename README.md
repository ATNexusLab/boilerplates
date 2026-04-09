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
? Qual gerenciador de pacotes?    npm / Bun
? Qual linter/formatter?          Prettier + ESLint / Biome
? Incluir Better Auth?            Sim / Não
? Incluir Docker?                 Sim / Não
```

## Frameworks Disponíveis

| Framework      | Tipo       | npm | Bun | Better Auth | Docker |
|---------------|------------|-----|-----|-------------|--------|
| ElysiaJS      | Backend    | ✗   | ✓   | ✓           | ✓      |
| ExpressJS     | Backend    | ✓   | ✓   | ✓           | ✓      |
| React + Vite  | Frontend   | ✓   | ✓   | ✗           | ✓      |
| Vue + Vite    | Frontend   | ✓   | ✓   | ✗           | ✓      |
| Next.js       | Fullstack  | ✓   | ✓   | ✓           | ✓      |
| Vinext        | Fullstack  | ✓   | ✓   | ✓           | ✓      |
| Flutter       | Mobile     | ✗   | ✗   | ✗           | ✓      |
| React Native  | Mobile     | ✓   | ✓   | ✗           | ✗      |

## Tooling

- **Prettier + ESLint** — Combo tradicional de linting e formatação
- **Biome** — Linter + formatter all-in-one (substitui ESLint e Prettier)
- **Better Auth** — Autenticação pronta para frameworks backend/fullstack
- **Docker** — Dockerfile + docker-compose otimizados por framework

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
