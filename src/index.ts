import { runPrompts } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import pc from "picocolors";

async function main() {
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
