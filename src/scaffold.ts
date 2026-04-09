import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import pc from "picocolors";
import type { UserChoices } from "./prompts.js";
import type { PackageManager } from "./templates.js";

const templatesDir = path.resolve(
  fileURLToPath(import.meta.url),
  "../../templates",
);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".dart",
  ".xml",
  ".gradle",
  ".properties",
  ".env",
  ".gitignore",
  ".dockerignore",
  ".editorconfig",
  ".prettierrc",
  ".eslintrc",
  ".toml",
  ".cfg",
  ".ini",
  ".txt",
  ".svg",
  ".sh",
  ".bash",
  ".zsh",
  ".fish",
  ".bat",
  ".cmd",
  ".ps1",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
]);

const SKIP_FILES = new Set(["template.json", "overlay.json"]);

const EDITORCONFIG = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
`;

function isTextFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const base = path.basename(filename);
  return ["Dockerfile", "Makefile", ".gitignore", ".dockerignore"].includes(
    base,
  );
}

function isCommandAvailable(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_FILES.has(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

function mergePackageJson(targetPath: string, overlayPath: string): void {
  if (!fs.existsSync(targetPath) || !fs.existsSync(overlayPath)) return;

  const target: PackageJson = JSON.parse(
    fs.readFileSync(targetPath, "utf-8"),
  );
  const overlay: PackageJson = JSON.parse(
    fs.readFileSync(overlayPath, "utf-8"),
  );

  for (const key of [
    "dependencies",
    "devDependencies",
    "scripts",
  ] as const) {
    if (overlay[key]) {
      target[key] = { ...(target[key] ?? {}), ...overlay[key] };
    }
  }

  fs.writeFileSync(targetPath, JSON.stringify(target, null, 2) + "\n");
}

function mergeEnvExample(targetDir: string, overlayDir: string, sectionName: string): void {
  const targetEnv = path.join(targetDir, ".env.example");
  const overlayEnv = path.join(overlayDir, ".env.example");

  if (!fs.existsSync(overlayEnv)) return;

  const overlayContent = fs.readFileSync(overlayEnv, "utf-8").trim();

  if (!fs.existsSync(targetEnv)) {
    fs.writeFileSync(targetEnv, overlayContent + "\n");
    return;
  }

  const existing = fs.readFileSync(targetEnv, "utf-8").trimEnd();
  const merged = `${existing}\n\n# ${sectionName}\n${overlayContent}\n`;
  fs.writeFileSync(targetEnv, merged);
}

function replaceVariables(
  dir: string,
  vars: Record<string, string>,
): void {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      replaceVariables(fullPath, vars);
    } else if (isTextFile(entry.name)) {
      let content = fs.readFileSync(fullPath, "utf-8");
      let changed = false;

      for (const [key, value] of Object.entries(vars)) {
        const placeholder = `{{${key}}}`;
        if (content.includes(placeholder)) {
          content = content.replaceAll(placeholder, value);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

function getInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case "bun": return "bun install";
    case "pnpm": return "pnpm install";
    case "yarn": return "yarn install";
    default: return "npm install";
  }
}

function getDevCommand(pm: PackageManager): string {
  switch (pm) {
    case "bun": return "bun dev";
    case "pnpm": return "pnpm dev";
    case "yarn": return "yarn dev";
    default: return "npm run dev";
  }
}

function checkPrerequisites(choices: UserChoices): void {
  if (choices.framework === "flutter" && !isCommandAvailable("flutter")) {
    p.log.warn(
      pc.yellow("⚠ Flutter CLI não encontrado no PATH. Instale em https://flutter.dev/docs/get-started/install"),
    );
  }

  if (choices.packageManager === "bun" && !isCommandAvailable("bun")) {
    p.log.warn(
      pc.yellow("⚠ Bun não encontrado no PATH. Instale em https://bun.sh"),
    );
  }

  if (choices.packageManager === "pnpm" && !isCommandAvailable("pnpm")) {
    p.log.warn(
      pc.yellow("⚠ pnpm não encontrado no PATH. Instale com: npm install -g pnpm"),
    );
  }

  if (choices.packageManager === "yarn" && !isCommandAvailable("yarn")) {
    p.log.warn(
      pc.yellow("⚠ Yarn não encontrado no PATH. Instale com: npm install -g yarn"),
    );
  }
}

export async function scaffold(choices: UserChoices): Promise<void> {
  const targetDir = path.resolve(process.cwd(), choices.projectName);

  if (fs.existsSync(targetDir)) {
    throw new Error(
      `O diretório "${choices.projectName}" já existe.`,
    );
  }

  // Check prerequisites
  checkPrerequisites(choices);

  // Verify base template exists
  const baseDir = path.join(templatesDir, "base", choices.framework);
  if (!fs.existsSync(baseDir)) {
    throw new Error(
      `Template base não encontrado para "${choices.framework}". Verifique se os templates estão instalados.`,
    );
  }

  try {
    // 1. Copy base template
    copyDir(baseDir, targetDir);

    const targetPkgPath = path.join(targetDir, "package.json");

    // 2. Apply linter overlay
    if (choices.linter) {
      const linterDir = path.join(templatesDir, "overlays", choices.linter);
      copyDir(linterDir, targetDir);

      const linterOverlay = path.join(linterDir, "overlay.json");
      mergePackageJson(targetPkgPath, linterOverlay);
    }

    // 3. Apply Better Auth overlay
    if (choices.includeBetterAuth) {
      const authDir = path.join(
        templatesDir,
        "overlays",
        "better-auth",
        choices.framework,
      );
      copyDir(authDir, targetDir);

      const authOverlay = path.join(authDir, "overlay.json");
      mergePackageJson(targetPkgPath, authOverlay);
      mergeEnvExample(targetDir, authDir, "Better Auth");
    }

    // 4. Apply Docker overlay
    if (choices.includeDocker) {
      const dockerDir = path.join(
        templatesDir,
        "overlays",
        "docker",
        choices.framework,
      );
      copyDir(dockerDir, targetDir);

      const dockerOverlay = path.join(dockerDir, "overlay.json");
      mergePackageJson(targetPkgPath, dockerOverlay);
    }

    // 5. Apply GitHub Actions CI overlay
    if (choices.includeCI) {
      const ciDir = path.join(templatesDir, "overlays", "github-actions");
      copyDir(ciDir, targetDir);
    }

    // 6. Write .editorconfig
    fs.writeFileSync(path.join(targetDir, ".editorconfig"), EDITORCONFIG);

    // 7. Replace template variables
    replaceVariables(targetDir, {
      PROJECT_NAME: choices.projectName,
    });

    // 8. Initialize git repository
    if (isCommandAvailable("git")) {
      try {
        execSync("git init", { cwd: targetDir, stdio: "ignore" });
        execSync("git add -A", { cwd: targetDir, stdio: "ignore" });
        execSync('git commit -m "chore: initial project setup"', {
          cwd: targetDir,
          stdio: "ignore",
        });
        p.log.success("Repositório git inicializado com commit inicial.");
      } catch {
        p.log.warn(pc.yellow("⚠ Não foi possível inicializar o repositório git."));
      }
    }

    // 9. Print success
    console.log();
    console.log(pc.green("✅ Projeto criado com sucesso!"));
    console.log();

    // 10. Install dependencies
    if (choices.framework === "flutter") {
      printFlutterInstructions(choices.projectName);
    } else {
      const pm = choices.packageManager ?? "npm";
      await maybeInstallDependencies(targetDir, pm);
      printInstructions(choices.projectName, pm);
    }

    console.log();
  } catch (error) {
    // Rollback: remove created directory on failure
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    throw error;
  }
}

async function maybeInstallDependencies(
  targetDir: string,
  pm: PackageManager,
): Promise<void> {
  if (!isCommandAvailable(pm === "npm" ? "npm" : pm)) return;

  const install = await p.confirm({
    message: "Deseja instalar as dependências agora?",
    initialValue: true,
  });

  if (p.isCancel(install) || !install) return;

  const installCmd = getInstallCommand(pm);
  const s = p.spinner();
  s.start(`Instalando dependências com ${pm}...`);

  try {
    execSync(installCmd, { cwd: targetDir, stdio: "ignore" });
    s.stop(`Dependências instaladas com ${pc.green("sucesso")}.`);
  } catch {
    s.stop(pc.yellow("⚠ Falha ao instalar dependências."));
    p.log.info(`Execute manualmente: ${pc.cyan(`cd ${path.basename(targetDir)} && ${installCmd}`)}`);
  }
}

function printFlutterInstructions(projectName: string): void {
  console.log(pc.bold("Próximos passos:"));
  console.log(`  ${pc.cyan(`cd ${projectName}`)}`);
  console.log(`  ${pc.cyan("flutter pub get")}`);
  console.log(`  ${pc.cyan("flutter run")}`);
}

function printInstructions(projectName: string, pm: PackageManager): void {
  const installCmd = getInstallCommand(pm);
  const devCmd = getDevCommand(pm);

  console.log(pc.bold("Próximos passos:"));
  console.log(`  ${pc.cyan(`cd ${projectName}`)}`);
  console.log(`  ${pc.cyan(installCmd)}`);
  console.log(`  ${pc.cyan(devCmd)}`);
}
