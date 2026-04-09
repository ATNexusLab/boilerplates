import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { UserChoices } from "./prompts.js";
import {
  type PackageManager,
  type PythonPackageManager,
  type Framework,
  type Database,
  type Cache,
  isPythonFramework,
  isPythonPackageManager,
} from "./templates.js";

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
  ".py",
  ".pyi",
  ".prisma",
]);

const SKIP_FILES = new Set(["template.json", "overlay.json", ".env.example"]);

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

[*.py]
indent_size = 4
`;

// ── Utility Functions ──────────────────────────────────────────────────────

function isTextFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const base = path.basename(filename);
  return [
    "Dockerfile",
    "Makefile",
    ".gitignore",
    ".dockerignore",
    "Procfile",
    "requirements.txt",
    "requirements-dev.txt",
  ].includes(base);
}

function isCommandAvailable(cmd: string): boolean {
  try {
    const isWindows = process.platform === "win32";
    execSync(isWindows ? `where ${cmd}` : `command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (source) => !SKIP_FILES.has(path.basename(source)),
  });
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

interface OverlayJson extends PackageJson {
  python?: {
    dependencies?: string[];
    devDependencies?: string[];
  };
}

function mergePackageJson(targetPath: string, overlayPath: string): void {
  if (!fs.existsSync(targetPath) || !fs.existsSync(overlayPath)) return;

  let target: PackageJson;
  let overlay: PackageJson;

  try {
    target = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
  } catch {
    p.log.warn(pc.yellow(`⚠ Não foi possível ler ${targetPath} (JSON inválido). Pulando merge.`));
    return;
  }

  try {
    overlay = JSON.parse(fs.readFileSync(overlayPath, "utf-8"));
  } catch {
    p.log.warn(pc.yellow(`⚠ Não foi possível ler ${overlayPath} (JSON inválido). Pulando merge.`));
    return;
  }

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

  // Delegate to content-based merge with deduplication
  mergeEnvExampleContent(targetDir, sectionName, overlayContent);
}

function mergeEnvExampleContent(targetDir: string, sectionName: string, content: string): void {
  const targetEnv = path.join(targetDir, ".env.example");

  if (!fs.existsSync(targetEnv)) {
    fs.writeFileSync(targetEnv, `# ${sectionName}\n${content}\n`);
    return;
  }

  const existing = fs.readFileSync(targetEnv, "utf-8").trimEnd();

  // Deduplicate: only add lines whose KEY= is not already present
  const existingKeys = new Set(
    existing
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => l.split("=")[0].trim()),
  );

  const newLines = content
    .split("\n")
    .filter((l) => {
      if (!l.includes("=") || l.startsWith("#")) return true;
      return !existingKeys.has(l.split("=")[0].trim());
    })
    .join("\n")
    .trim();

  if (!newLines) return;

  const merged = `${existing}\n\n# ${sectionName}\n${newLines}\n`;
  fs.writeFileSync(targetEnv, merged);
}

function mergePythonDeps(targetDir: string, overlayPath: string): void {
  if (!fs.existsSync(overlayPath)) return;

  let overlay: OverlayJson;
  try {
    overlay = JSON.parse(fs.readFileSync(overlayPath, "utf-8"));
  } catch {
    p.log.warn(pc.yellow(`⚠ Não foi possível ler ${overlayPath} (JSON inválido). Pulando merge de deps Python.`));
    return;
  }

  if (!overlay.python) return;

  const reqPath = path.join(targetDir, "requirements.txt");
  if (fs.existsSync(reqPath)) {
    const existing = fs.readFileSync(reqPath, "utf-8").trimEnd();
    const newDeps = overlay.python.dependencies ?? [];
    if (newDeps.length > 0) {
      fs.writeFileSync(reqPath, existing + "\n" + newDeps.join("\n") + "\n");
    }
  }

  const reqDevPath = path.join(targetDir, "requirements-dev.txt");
  const devDeps = overlay.python.devDependencies ?? [];
  if (devDeps.length > 0) {
    if (fs.existsSync(reqDevPath)) {
      const existing = fs.readFileSync(reqDevPath, "utf-8").trimEnd();
      fs.writeFileSync(reqDevPath, existing + "\n" + devDeps.join("\n") + "\n");
    } else {
      fs.writeFileSync(reqDevPath, devDeps.join("\n") + "\n");
    }
  }
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

// ── Install / Dev Commands ─────────────────────────────────────────────────

function getInstallCommand(pm: PackageManager | PythonPackageManager): string {
  switch (pm) {
    case "bun": return "bun install";
    case "pnpm": return "pnpm install";
    case "yarn": return "yarn install";
    case "pip": return "pip install -r requirements.txt";
    case "poetry": return "poetry install";
    case "uv": return "uv sync";
    default: return "npm install";
  }
}

function getDevCommand(pm: PackageManager | PythonPackageManager): string {
  switch (pm) {
    case "bun": return "bun dev";
    case "pnpm": return "pnpm dev";
    case "yarn": return "yarn dev";
    case "pip": return "python src/server.py";
    case "poetry": return "poetry run python src/server.py";
    case "uv": return "uv run python src/server.py";
    default: return "npm run dev";
  }
}

/** Returns the command to bootstrap-install a package manager when it's missing. */
function getPackageManagerBootstrapCommand(pm: PackageManager | PythonPackageManager): string | null {
  switch (pm) {
    case "bun":    return "npm install -g bun";
    case "pnpm":   return "npm install -g pnpm";
    case "yarn":   return "npm install -g yarn";
    case "poetry": return "pip install poetry";
    case "uv":     return "pip install uv";
    default:       return null; // npm and pip are assumed pre-installed
  }
}

async function ensurePackageManagerInstalled(pm: PackageManager | PythonPackageManager): Promise<boolean> {
  const bin = pm === "npm" ? "npm" : String(pm);
  if (isCommandAvailable(bin)) return true;

  const bootstrapCmd = getPackageManagerBootstrapCommand(pm);
  if (!bootstrapCmd) return false;

  const s = p.spinner();
  s.start(`${pm} não encontrado. Instalando automaticamente...`);
  try {
    execSync(bootstrapCmd, { stdio: "ignore" });
    s.stop(`${pm} instalado com ${pc.green("sucesso")}.`);
    return true;
  } catch {
    s.stop(pc.yellow(`⚠ Não foi possível instalar ${pm} automaticamente.`));
    p.log.info(`Instale manualmente: ${pc.cyan(bootstrapCmd)}`);
    return false;
  }
}

// ── Prerequisites ──────────────────────────────────────────────────────────

function checkPrerequisites(choices: UserChoices): void {
  const frameworks = getScaffoldFrameworks(choices);

  for (const fw of frameworks) {
    if (fw === "flutter" && !isCommandAvailable("flutter")) {
      p.log.warn(
        pc.yellow("⚠ Flutter CLI não encontrado no PATH. Instale em https://flutter.dev/docs/get-started/install"),
      );
    }
  }
}

function getScaffoldFrameworks(choices: UserChoices): Framework[] {
  const fws: Framework[] = [];
  if (choices.backend) fws.push(choices.backend.apiFramework);
  if (choices.frontend?.webFramework) fws.push(choices.frontend.webFramework);
  if (choices.frontend?.mobileFramework) fws.push(choices.frontend.mobileFramework);
  return fws;
}

function getPackageManagers(choices: UserChoices): (PackageManager | PythonPackageManager)[] {
  const pms: (PackageManager | PythonPackageManager)[] = [];
  if (choices.backend) pms.push(choices.backend.packageManager);
  if (choices.frontend) pms.push(choices.frontend.packageManager);
  return [...new Set(pms)];
}


// ── Docker Compose Generation ──────────────────────────────────────────────

function appendDockerComposeServices(
  targetDir: string,
  database: Database | null,
  cache: Cache | null,
  framework: Framework,
): void {
  const dcPath = path.join(targetDir, "docker-compose.yml");
  if (!fs.existsSync(dcPath)) return;
  if (!database && !cache) return;

  let doc: Record<string, unknown>;
  try {
    doc = parseYaml(fs.readFileSync(dcPath, "utf-8")) as Record<string, unknown>;
  } catch {
    p.log.warn(pc.yellow("⚠ Não foi possível parsear docker-compose.yml. Serviços de DB/Cache não adicionados."));
    return;
  }

  const services = (doc.services ?? {}) as Record<string, unknown>;

  // Add depends_on to the app service
  const appService = services[framework] as Record<string, unknown> | undefined;
  if (appService) {
    const deps: string[] = [];
    if (database) deps.push("db");
    if (cache) deps.push("cache");
    if (deps.length > 0) {
      appService.depends_on = deps;
    }
  }

  // Append DB service
  if (database === "postgresql") {
    services.db = {
      image: "postgres:16-alpine",
      restart: "unless-stopped",
      ports: ["5432:5432"],
      environment: {
        POSTGRES_USER: "${DB_USER:-postgres}",
        POSTGRES_PASSWORD: "${DB_PASSWORD:-postgres}",
        POSTGRES_DB: "${DB_NAME:-app}",
      },
      volumes: ["postgres_data:/var/lib/postgresql/data"],
      healthcheck: {
        test: ["CMD-SHELL", "pg_isready -U postgres"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    };
  } else if (database === "mysql") {
    services.db = {
      image: "mysql:8",
      restart: "unless-stopped",
      ports: ["3306:3306"],
      environment: {
        MYSQL_ROOT_PASSWORD: "${DB_PASSWORD:-root}",
        MYSQL_DATABASE: "${DB_NAME:-app}",
        MYSQL_USER: "${DB_USER:-app}",
        MYSQL_PASSWORD: "${DB_PASSWORD:-app}",
      },
      volumes: ["mysql_data:/var/lib/mysql"],
      healthcheck: {
        test: ["CMD", "mysqladmin", "ping", "-h", "localhost"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    };
  } else if (database === "mongodb") {
    services.db = {
      image: "mongo:7",
      restart: "unless-stopped",
      ports: ["27017:27017"],
      environment: {
        MONGO_INITDB_ROOT_USERNAME: "${DB_USER:-mongo}",
        MONGO_INITDB_ROOT_PASSWORD: "${DB_PASSWORD:-mongo}",
      },
      volumes: ["mongo_data:/data/db"],
      healthcheck: {
        test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    };
  }

  // Append cache service
  if (cache === "redis") {
    services.cache = {
      image: "redis:7-alpine",
      restart: "unless-stopped",
      ports: ["6379:6379"],
      volumes: ["redis_data:/data"],
      healthcheck: {
        test: ["CMD", "redis-cli", "ping"],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    };
  }

  doc.services = services;

  // Ensure volumes section
  const volumes = (doc.volumes ?? {}) as Record<string, unknown>;
  if (database === "postgresql") volumes.postgres_data = null;
  if (database === "mysql") volumes.mysql_data = null;
  if (database === "mongodb") volumes.mongo_data = null;
  if (cache === "redis") volumes.redis_data = null;
  if (Object.keys(volumes).length > 0) doc.volumes = volumes;

  fs.writeFileSync(dcPath, stringifyYaml(doc));
}

// ── Overlay Application ────────────────────────────────────────────────────

function applyOverlay(
  targetDir: string,
  overlayName: string,
  framework?: string,
  sectionName?: string,
): void {
  const overlayDir = framework
    ? path.join(templatesDir, "overlays", overlayName, framework)
    : path.join(templatesDir, "overlays", overlayName);

  if (!fs.existsSync(overlayDir)) return;

  copyDir(overlayDir, targetDir);

  const overlayJsonPath = path.join(overlayDir, "overlay.json");
  const targetPkgPath = path.join(targetDir, "package.json");

  if (fs.existsSync(overlayJsonPath)) {
    // JS/TS deps
    if (fs.existsSync(targetPkgPath)) {
      mergePackageJson(targetPkgPath, overlayJsonPath);
    }
    // Python deps
    mergePythonDeps(targetDir, overlayJsonPath);
  }

  if (sectionName) {
    mergeEnvExample(targetDir, overlayDir, sectionName);
  }
}

// ── Single Project Scaffold ────────────────────────────────────────────────

function scaffoldSingleProject(
  targetDir: string,
  framework: Framework,
  choices: UserChoices,
  isBackend: boolean,
): void {
  // 1. Copy base template
  const baseDir = path.join(templatesDir, "base", framework);
  if (!fs.existsSync(baseDir)) {
    throw new Error(
      `Template base não encontrado para "${framework}". Verifique se os templates estão instalados.`,
    );
  }
  copyDir(baseDir, targetDir);

  // Copy base .env.example explicitly (SKIP_FILES prevents copyDir from doing it)
  const baseEnvPath = path.join(baseDir, ".env.example");
  if (fs.existsSync(baseEnvPath)) {
    fs.copyFileSync(baseEnvPath, path.join(targetDir, ".env.example"));
  }

  const backend = isBackend ? choices.backend : null;
  const frontend = !isBackend ? choices.frontend : null;
  const isPython = isBackend && backend && isPythonFramework(backend.apiFramework);

  // 2. Apply linter overlay
  const linter = isBackend ? backend?.linter : frontend?.linter;
  if (linter) {
    applyOverlay(targetDir, linter);
  }

  // 3. Apply database overlay
  if (backend?.database) {
    const dbOverlayDir = path.join(templatesDir, "overlays", "databases", backend.database);
    if (fs.existsSync(dbOverlayDir)) {
      const overlayJsonPath = path.join(dbOverlayDir, "overlay.json");
      if (fs.existsSync(overlayJsonPath)) {
        const targetPkgPath = path.join(targetDir, "package.json");
        if (!isPython && fs.existsSync(targetPkgPath)) {
          mergePackageJson(targetPkgPath, overlayJsonPath);
        }
        if (isPython) {
          mergePythonDeps(targetDir, overlayJsonPath);
        }
      }
      mergeEnvExample(targetDir, dbOverlayDir, "Database");
    }
  }

  // 4. Apply ORM overlay
  if (backend?.orm) {
    const ormBase = path.join(templatesDir, "overlays", "orm", backend.orm);
    // Drizzle has per-database subfolders
    const ormDir = backend.orm === "drizzle" && backend.database
      ? path.join(ormBase, backend.database)
      : ormBase;

    if (fs.existsSync(ormDir)) {
      copyDir(ormDir, targetDir);
      const overlayJsonPath = path.join(ormDir, "overlay.json");
      if (fs.existsSync(overlayJsonPath)) {
        const targetPkgPath = path.join(targetDir, "package.json");
        if (!isPython && fs.existsSync(targetPkgPath)) {
          mergePackageJson(targetPkgPath, overlayJsonPath);
        }
        if (isPython) {
          mergePythonDeps(targetDir, overlayJsonPath);
        }
      }
    }
  }

  // 5. Apply cache overlay
  if (backend?.cache) {
    const cacheOverlayDir = path.join(templatesDir, "overlays", "cache", backend.cache);
    if (fs.existsSync(cacheOverlayDir)) {
      // Copy appropriate connection helper based on language
      if (isPython) {
        const pyHelper = path.join(cacheOverlayDir, "src", "lib", "redis.py");
        if (fs.existsSync(pyHelper)) {
          const destDir = path.join(targetDir, "src", "lib");
          fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(pyHelper, path.join(destDir, "redis.py"));
        }
      } else {
        const tsHelper = path.join(cacheOverlayDir, "src", "lib", "redis.ts");
        if (fs.existsSync(tsHelper)) {
          const destDir = path.join(targetDir, "src", "lib");
          fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(tsHelper, path.join(destDir, "redis.ts"));
        }
      }

      const overlayJsonPath = path.join(cacheOverlayDir, "overlay.json");
      if (fs.existsSync(overlayJsonPath)) {
        const targetPkgPath = path.join(targetDir, "package.json");
        if (!isPython && fs.existsSync(targetPkgPath)) {
          mergePackageJson(targetPkgPath, overlayJsonPath);
        }
        if (isPython) {
          mergePythonDeps(targetDir, overlayJsonPath);
        }
      }
      mergeEnvExample(targetDir, cacheOverlayDir, "Cache");
    }
  }

  // 6. Apply auth overlay
  if (backend?.includeAuth) {
    if (isPython) {
      const authOverlayName =
        backend.apiFramework === "flask"
          ? "flask-login"
          : backend.apiFramework === "fastapi"
            ? "fastapi-security"
            : "django-auth";
      applyOverlay(targetDir, `auth/${authOverlayName}`, undefined, authOverlayName);
    } else {
      applyOverlay(targetDir, "better-auth", backend.apiFramework, "Better Auth");
    }
  }

  // 7. Apply Docker overlay
  if (choices.includeDocker) {
    applyOverlay(targetDir, "docker", framework);

    // Append DB/Cache services to docker-compose
    if (backend) {
      appendDockerComposeServices(
        targetDir,
        backend.database,
        backend.cache,
        framework,
      );
    }
  }

  // 8. Apply CI overlay
  if (choices.includeCI) {
    applyOverlay(targetDir, "github-actions");
  }
}

// ── Bun Test Swap ────────────────────────────────────────────────────────

function applyBunTestSwap(targetDir: string, choices: UserChoices): void {
  const pms: string[] = [];
  if (choices.backend) pms.push(choices.backend.packageManager);
  if (choices.frontend) pms.push(choices.frontend.packageManager);

  if (!pms.includes("bun")) return;

  const pkgFiles = findFiles(targetDir, "package.json");
  for (const pkgPath of pkgFiles) {
    try {
      const raw = fs.readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw);

      if (pkg.scripts?.test === "vitest run") {
        pkg.scripts.test = "bun test";
      }

      if (pkg.devDependencies?.vitest) {
        delete pkg.devDependencies.vitest;
      }

      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    } catch {
      // skip non-parseable files
    }
  }
}

function findFiles(dir: string, filename: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...findFiles(full, filename));
    } else if (entry.name === filename) {
      results.push(full);
    }
  }
  return results;
}

// ── Main Scaffold ──────────────────────────────────────────────────────────

export async function scaffold(choices: UserChoices): Promise<void> {
  const targetDir = path.resolve(process.cwd(), choices.projectName);

  if (fs.existsSync(targetDir)) {
    throw new Error(
      `O diretório "${choices.projectName}" já existe.`,
    );
  }

  checkPrerequisites(choices);

  const isMonorepo = Boolean(
    (choices.projectType === "fullstack" && choices.backend && choices.frontend) ||
    (choices.frontend?.platform === "both"),
  );

  try {
    fs.mkdirSync(targetDir, { recursive: true });

    if (isMonorepo) {
      scaffoldMonorepo(targetDir, choices);
    } else {
      scaffoldSingle(targetDir, choices);
    }

    // Write .editorconfig
    fs.writeFileSync(path.join(targetDir, ".editorconfig"), EDITORCONFIG);

    // Replace template variables
    const templateVars: Record<string, string> = {
      PROJECT_NAME: choices.projectName,
    };

    // Set PRISMA_PROVIDER if needed
    if (choices.backend?.orm === "prisma" && choices.backend.database) {
      const providerMap: Record<string, string> = {
        postgresql: "postgresql",
        mysql: "mysql",
        mongodb: "mongodb",
      };
      templateVars.PRISMA_PROVIDER = providerMap[choices.backend.database];
    }

    // Set DATABASE_URL placeholder
    if (choices.backend?.database) {
      const urlMap: Record<string, string> = {
        postgresql: "postgresql://user:password@localhost:5432/app",
        mysql: "mysql://user:password@localhost:3306/app",
        mongodb: "mongodb://user:password@localhost:27017/app",
      };
      templateVars.DATABASE_URL = urlMap[choices.backend.database];
    }

    replaceVariables(targetDir, templateVars);

    // Bun test swap: replace vitest with bun's native test runner
    applyBunTestSwap(targetDir, choices);

    // Initialize git repository
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

    // Print success
    console.log();
    console.log(pc.green("✅ Projeto criado com sucesso!"));
    console.log();

    // Install dependencies
    await handlePostScaffold(targetDir, choices, isMonorepo);

    console.log();
  } catch (error) {
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      p.log.warn(pc.yellow(`⚠ Processo abortado. O diretório "${choices.projectName}" foi removido.`));
    }
    throw error;
  }
}

function scaffoldSingle(targetDir: string, choices: UserChoices): void {
  if (choices.backend) {
    scaffoldSingleProject(targetDir, choices.backend.apiFramework, choices, true);
  } else if (choices.frontend) {
    const fw = choices.frontend.webFramework ?? choices.frontend.mobileFramework;
    if (!fw) throw new Error("Nenhum framework selecionado.");
    scaffoldSingleProject(targetDir, fw, choices, false);
  }
}

function scaffoldMonorepo(targetDir: string, choices: UserChoices): void {
  const appsDir = path.join(targetDir, "apps");
  fs.mkdirSync(appsDir, { recursive: true });

  // Scaffold backend in apps/api/
  if (choices.backend) {
    const apiDir = path.join(appsDir, "api");
    scaffoldSingleProject(apiDir, choices.backend.apiFramework, choices, true);
  }

  // Scaffold web frontend in apps/web/
  if (choices.frontend?.webFramework) {
    const webDir = path.join(appsDir, "web");
    scaffoldSingleProject(webDir, choices.frontend.webFramework, choices, false);
  }

  // Scaffold mobile in apps/mobile/
  if (choices.frontend?.mobileFramework) {
    const mobileDir = path.join(appsDir, "mobile");
    scaffoldSingleProject(mobileDir, choices.frontend.mobileFramework, choices, false);
  }

  // Generate root files
  generateMonorepoRoot(targetDir, choices);
}

function generateMonorepoRoot(targetDir: string, choices: UserChoices): void {
  // Root .gitignore
  const gitignore = `node_modules/
dist/
.env
.env.local
.env.*.local
*.log
logs/
.DS_Store
__pycache__/
*.pyc
.venv/
`;
  fs.writeFileSync(path.join(targetDir, ".gitignore"), gitignore);

  // Root README
  const parts: string[] = [];
  if (choices.backend) parts.push(`- \`apps/api/\` — ${choices.backend.apiFramework} API`);
  if (choices.frontend?.webFramework) parts.push(`- \`apps/web/\` — ${choices.frontend.webFramework}`);
  if (choices.frontend?.mobileFramework) parts.push(`- \`apps/mobile/\` — ${choices.frontend.mobileFramework}`);

  const readme = `# ${choices.projectName}

## Estrutura

${parts.join("\n")}

## Começando

Cada app tem seu próprio \`package.json\` (ou \`requirements.txt\`). Acesse o diretório de cada app para instalar dependências e rodar.
`;
  fs.writeFileSync(path.join(targetDir, "README.md"), readme);

  // Root package.json with workspaces (for JS/TS apps only)
  const jsApps: string[] = [];
  if (choices.backend && !isPythonFramework(choices.backend.apiFramework)) {
    jsApps.push("apps/api");
  }
  if (choices.frontend?.webFramework) jsApps.push("apps/web");
  if (choices.frontend?.mobileFramework && choices.frontend.mobileFramework !== "flutter") {
    jsApps.push("apps/mobile");
  }

  if (jsApps.length > 0) {
    const rootPkg = {
      name: choices.projectName,
      private: true,
      workspaces: jsApps,
    };
    fs.writeFileSync(
      path.join(targetDir, "package.json"),
      JSON.stringify(rootPkg, null, 2) + "\n",
    );
  }
}

// ── Post-scaffold ──────────────────────────────────────────────────────────

async function handlePostScaffold(
  targetDir: string,
  choices: UserChoices,
  isMonorepo: boolean,
): Promise<void> {
  if (isMonorepo) {
    printMonorepoInstructions(choices);
    return;
  }

  // Single project
  const hasMobile = choices.frontend?.mobileFramework === "flutter";
  if (hasMobile && !choices.frontend?.webFramework) {
    printFlutterInstructions(choices.projectName);
    return;
  }

  const pm =
    choices.backend?.packageManager ??
    choices.frontend?.packageManager ??
    "npm";

  if (!isPythonPackageManager(pm)) {
    await maybeInstallDependencies(targetDir, pm);
  } else {
    p.log.info(`Para instalar dependências: ${pc.cyan(getInstallCommand(pm))}`);
  }

  printInstructions(choices.projectName, pm);
}

async function maybeInstallDependencies(
  targetDir: string,
  pm: PackageManager,
): Promise<void> {
  const pmAvailable = await ensurePackageManagerInstalled(pm);
  if (!pmAvailable) return;

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

function printInstructions(projectName: string, pm: PackageManager | PythonPackageManager): void {
  const installCmd = getInstallCommand(pm);
  const devCmd = getDevCommand(pm);

  console.log(pc.bold("Próximos passos:"));
  console.log(`  ${pc.cyan(`cd ${projectName}`)}`);
  console.log(`  ${pc.cyan(installCmd)}`);
  console.log(`  ${pc.cyan(devCmd)}`);
}

function printMonorepoInstructions(choices: UserChoices): void {
  console.log(pc.bold("Próximos passos:"));
  console.log(`  ${pc.cyan(`cd ${choices.projectName}`)}`);
  console.log();

  if (choices.backend) {
    const pm = choices.backend.packageManager;
    console.log(pc.bold("  API:"));
    console.log(`    ${pc.cyan(`cd apps/api && ${getInstallCommand(pm)}`)}`);
  }

  if (choices.frontend?.webFramework) {
    const pm = choices.frontend.packageManager;
    console.log(pc.bold("  Web:"));
    console.log(`    ${pc.cyan(`cd apps/web && ${getInstallCommand(pm)}`)}`);
  }

  if (choices.frontend?.mobileFramework) {
    const fw = choices.frontend.mobileFramework;
    console.log(pc.bold("  Mobile:"));
    if (fw === "flutter") {
      console.log(`    ${pc.cyan("cd apps/mobile && flutter pub get")}`);
    } else {
      const pm = choices.frontend.packageManager;
      console.log(`    ${pc.cyan(`cd apps/mobile && ${getInstallCommand(pm)}`)}`);
    }
  }
}
