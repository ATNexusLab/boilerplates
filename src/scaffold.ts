import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";
import type { UserChoices } from "./prompts.js";

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

function isTextFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  // Files without extension that are commonly text
  const base = path.basename(filename);
  return ["Dockerfile", "Makefile", ".gitignore", ".dockerignore"].includes(
    base,
  );
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

export async function scaffold(choices: UserChoices): Promise<void> {
  const targetDir = path.resolve(process.cwd(), choices.projectName);

  if (fs.existsSync(targetDir)) {
    throw new Error(
      `O diretório "${choices.projectName}" já existe.`,
    );
  }

  // 1. Copy base template
  const baseDir = path.join(templatesDir, "base", choices.framework);
  if (!fs.existsSync(baseDir)) {
    throw new Error(
      `Template base não encontrado para "${choices.framework}". Verifique se os templates estão instalados.`,
    );
  }
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

  // 5. Replace template variables
  replaceVariables(targetDir, {
    PROJECT_NAME: choices.projectName,
  });

  // 6. Print post-creation instructions
  console.log();
  console.log(pc.green("✅ Projeto criado com sucesso!"));
  console.log();
  console.log(pc.bold("Próximos passos:"));

  if (choices.framework === "flutter") {
    console.log(`  ${pc.cyan(`cd ${choices.projectName}`)}`);
    console.log(`  ${pc.cyan("flutter pub get")}`);
    console.log(`  ${pc.cyan("flutter run")}`);
  } else {
    const pm = choices.packageManager ?? "npm";
    const installCmd = pm === "bun" ? "bun install" : "npm install";
    const devCmd = pm === "bun" ? "bun dev" : "npm run dev";

    console.log(`  ${pc.cyan(`cd ${choices.projectName}`)}`);
    console.log(`  ${pc.cyan(installCmd)}`);
    console.log(`  ${pc.cyan(devCmd)}`);
  }

  console.log();
}
