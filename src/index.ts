import { runPrompts } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import pc from "picocolors";
import { createRequire } from "node:module";

function showVersion(): void {
  const require = createRequire(import.meta.url);
  const pkg = require("../package.json");
  console.log(`${pkg.name} v${pkg.version}`);
}

function showHelp(): void {
  showVersion();
  console.log();
  console.log("CLI interativo para criar projetos com os boilerplates da ATNexusLab.");
  console.log();
  console.log(pc.bold("Uso:"));
  console.log("  npx @atnexuslab/create-app          Inicia o wizard interativo");
  console.log("  npx @atnexuslab/create-app --help    Exibe esta mensagem");
  console.log("  npx @atnexuslab/create-app --version Exibe a versão");
  console.log();
  console.log(pc.bold("Opções:"));
  console.log("  -h, --help     Exibe ajuda");
  console.log("  -v, --version  Exibe versão");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    showVersion();
    process.exit(0);
  }

  try {
    const choices = await runPrompts();
    await scaffold(choices);
  } catch (error) {
    console.error(
      pc.red("Erro:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
