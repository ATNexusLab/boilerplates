import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  type ProjectType,
  type ApiFramework,
  type WebFramework,
  type MobileFramework,
  type Database,
  type ORM,
  type Cache,
  type Platform,
  type PackageManager,
  type PythonPackageManager,
  type Linter,
  type PythonLinter,
  type Framework,
  apiFrameworks,
  webFrameworks,
  mobileFrameworks,
  isPythonFramework,
  getAvailableORMs,
  getAvailableDatabases,
  getAvailableLinters,
  getAvailablePackageManagers,
} from "./templates.js";

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface BackendChoices {
  apiFramework: ApiFramework;
  database: Database | null;
  orm: ORM | null;
  cache: Cache | null;
  packageManager: PackageManager | PythonPackageManager;
  linter: Linter | PythonLinter | null;
  includeAuth: boolean;
}

export interface FrontendChoices {
  platform: Platform;
  webFramework: WebFramework | null;
  mobileFramework: MobileFramework | null;
  packageManager: PackageManager;
  linter: Linter | null;
}

export interface UserChoices {
  projectName: string;
  projectType: ProjectType;
  backend: BackendChoices | null;
  frontend: FrontendChoices | null;
  includeDocker: boolean;
  includeCI: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  backend: "Backend",
  frontend: "Frontend",
  fullstack: "Fullstack",
  mobile: "Mobile",
};

const DATABASE_LABELS: Record<Database, string> = {
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
};

const ORM_LABELS: Record<ORM, string> = {
  prisma: "Prisma",
  drizzle: "Drizzle",
  sqlalchemy: "SQLAlchemy",
};

function isValidDirName(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

function cancelAndExit(): never {
  p.cancel("Operação cancelada.");
  process.exit(0);
}

/** Collects all unique template directories that will be scaffolded */
export function getTemplateFrameworks(choices: UserChoices): Framework[] {
  const frameworks: Framework[] = [];
  if (choices.backend) frameworks.push(choices.backend.apiFramework);
  if (choices.frontend?.webFramework) frameworks.push(choices.frontend.webFramework);
  if (choices.frontend?.mobileFramework) frameworks.push(choices.frontend.mobileFramework);
  return frameworks;
}

// ── Sub-flows ──────────────────────────────────────────────────────────────

async function promptBackend(): Promise<BackendChoices> {
  // 1. API Framework
  const apiFramework = await p.select<ApiFramework>({
    message: "Qual framework de API?",
    options: [...apiFrameworks.values()].map((f) => ({
      value: f.name,
      label: f.displayName,
    })),
  });
  if (p.isCancel(apiFramework)) cancelAndExit();

  const isPython = isPythonFramework(apiFramework);

  // 2. Database
  const availableDbs = getAvailableDatabases(apiFramework);
  let database: Database | null = null;

  if (availableDbs.length > 0) {
    const dbChoice = await p.select<Database | "none">({
      message: "Banco de dados?",
      options: [
        { value: "none" as const, label: "Nenhum" },
        ...availableDbs.map((db) => ({
          value: db,
          label: DATABASE_LABELS[db],
        })),
      ],
    });
    if (p.isCancel(dbChoice)) cancelAndExit();
    database = dbChoice === "none" ? null : dbChoice;
  }

  // 3. ORM (only if database selected)
  let orm: ORM | null = null;

  if (database) {
    if (apiFramework === "django") {
      p.log.info(`ORM: ${pc.cyan("Django ORM")} (built-in)`);
    } else {
      const availableOrms = getAvailableORMs(apiFramework, database);
      if (availableOrms.length > 0) {
        const ormChoice = await p.select<ORM | "none">({
          message: "ORM?",
          options: [
            { value: "none" as const, label: "Nenhum" },
            ...availableOrms.map((o) => ({
              value: o,
              label: ORM_LABELS[o],
            })),
          ],
        });
        if (p.isCancel(ormChoice)) cancelAndExit();
        orm = ormChoice === "none" ? null : ormChoice;
      }
    }
  }

  // 4. Cache
  const cacheChoice = await p.select<Cache | "none">({
    message: "Cache?",
    options: [
      { value: "none" as const, label: "Nenhum" },
      { value: "redis" as const, label: "Redis" },
    ],
  });
  if (p.isCancel(cacheChoice)) cancelAndExit();
  const cache: Cache | null = cacheChoice === "none" ? null : cacheChoice;

  // 5. Package Manager
  const availablePMs = getAvailablePackageManagers(apiFramework);
  let packageManager: PackageManager | PythonPackageManager;

  if (availablePMs.length === 1) {
    packageManager = availablePMs[0];
    p.log.info(`Gerenciador de pacotes: ${pc.cyan(packageManager)}`);
  } else {
    const pm = await p.select<PackageManager | PythonPackageManager>({
      message: "Qual gerenciador de pacotes?",
      options: availablePMs.map((pm) => ({ value: pm, label: pm })),
    });
    if (p.isCancel(pm)) cancelAndExit();
    packageManager = pm;
  }

  // 6. Linter
  const availableLinters = getAvailableLinters(apiFramework);
  let linter: Linter | PythonLinter | null = null;

  if (availableLinters.length === 1) {
    linter = availableLinters[0];
    p.log.info(`Linter: ${pc.cyan(linter)}`);
  } else if (availableLinters.length > 1) {
    const linterChoice = await p.select<Linter | PythonLinter>({
      message: "Qual linter/formatter?",
      options: availableLinters.map((l) => ({
        value: l,
        label:
          l === "eslint-prettier"
            ? "Prettier + ESLint"
            : l === "biome"
              ? "Biome"
              : "Ruff",
      })),
    });
    if (p.isCancel(linterChoice)) cancelAndExit();
    linter = linterChoice;
  }

  // 7. Auth
  let includeAuth = false;
  const authLabel = isPython
    ? apiFramework === "flask"
      ? "Flask-Login"
      : apiFramework === "fastapi"
        ? "FastAPI Security (JWT)"
        : "Django Auth"
    : "Better Auth";

  const auth = await p.confirm({
    message: `Incluir ${authLabel}?`,
  });
  if (p.isCancel(auth)) cancelAndExit();
  includeAuth = auth;

  return {
    apiFramework,
    database,
    orm,
    cache,
    packageManager,
    linter,
    includeAuth,
  };
}

async function promptWebFramework(): Promise<{
  webFramework: WebFramework;
  packageManager: PackageManager;
  linter: Linter | null;
}> {
  const webFramework = await p.select<WebFramework>({
    message: "Qual framework web?",
    options: [...webFrameworks.values()].map((f) => ({
      value: f.name,
      label: f.displayName,
    })),
  });
  if (p.isCancel(webFramework)) cancelAndExit();

  const config = webFrameworks.get(webFramework)!;

  let packageManager: PackageManager;
  if (config.packageManagers.length === 1) {
    packageManager = config.packageManagers[0];
    p.log.info(`Gerenciador de pacotes: ${pc.cyan(packageManager)}`);
  } else {
    const pm = await p.select<PackageManager>({
      message: "Qual gerenciador de pacotes?",
      options: config.packageManagers.map((pm) => ({
        value: pm,
        label: pm,
      })),
    });
    if (p.isCancel(pm)) cancelAndExit();
    packageManager = pm;
  }

  const linterChoice = await p.select<Linter>({
    message: "Qual linter/formatter?",
    options: [
      { value: "eslint-prettier" as const, label: "Prettier + ESLint" },
      { value: "biome" as const, label: "Biome" },
    ],
  });
  if (p.isCancel(linterChoice)) cancelAndExit();

  return { webFramework, packageManager, linter: linterChoice };
}

async function promptMobileFramework(): Promise<{
  mobileFramework: MobileFramework;
  packageManager: PackageManager | null;
}> {
  const mobileFramework = await p.select<MobileFramework>({
    message: "Qual framework mobile?",
    options: [...mobileFrameworks.values()].map((f) => ({
      value: f.name,
      label: f.displayName,
    })),
  });
  if (p.isCancel(mobileFramework)) cancelAndExit();

  const config = mobileFrameworks.get(mobileFramework)!;

  let packageManager: PackageManager | null = null;
  if (config.packageManagers.length === 0) {
    // Flutter — no JS package manager
  } else if (config.packageManagers.length === 1) {
    packageManager = config.packageManagers[0];
    p.log.info(`Gerenciador de pacotes: ${pc.cyan(packageManager)}`);
  } else {
    const pm = await p.select<PackageManager>({
      message: "Qual gerenciador de pacotes?",
      options: config.packageManagers.map((pm) => ({
        value: pm,
        label: pm,
      })),
    });
    if (p.isCancel(pm)) cancelAndExit();
    packageManager = pm;
  }

  return { mobileFramework, packageManager };
}

async function promptFrontend(): Promise<FrontendChoices> {
  const platform = await p.select<Platform>({
    message: "Qual plataforma?",
    options: [
      { value: "web" as const, label: "Web" },
      { value: "mobile" as const, label: "Mobile" },
      { value: "both" as const, label: "Web + Mobile" },
    ],
  });
  if (p.isCancel(platform)) cancelAndExit();

  let webFramework: WebFramework | null = null;
  let mobileFramework: MobileFramework | null = null;
  let packageManager: PackageManager = "npm";
  let linter: Linter | null = null;

  if (platform === "web" || platform === "both") {
    const web = await promptWebFramework();
    webFramework = web.webFramework;
    packageManager = web.packageManager;
    linter = web.linter;
  }

  if (platform === "mobile" || platform === "both") {
    const mobile = await promptMobileFramework();
    mobileFramework = mobile.mobileFramework;
    if (platform === "mobile" && mobile.packageManager) {
      packageManager = mobile.packageManager;
    }
  }

  // Linter for mobile-only (non-Flutter)
  if (platform === "mobile" && mobileFramework !== "flutter" && !linter) {
    const linterChoice = await p.select<Linter>({
      message: "Qual linter/formatter?",
      options: [
        { value: "eslint-prettier" as const, label: "Prettier + ESLint" },
        { value: "biome" as const, label: "Biome" },
      ],
    });
    if (p.isCancel(linterChoice)) cancelAndExit();
    linter = linterChoice;
  }

  return { platform, webFramework, mobileFramework, packageManager, linter };
}

// ── Main ───────────────────────────────────────────────────────────────────

export async function runPrompts(): Promise<UserChoices> {
  p.intro(pc.bgCyan(pc.black(" 🚀 @atnexuslab/create-app ")));

  // 1. Project name
  const projectName = await p.text({
    message: "Qual o nome do projeto?",
    placeholder: "my-app",
    validate(value) {
      if (!value || value.trim().length === 0) {
        return "O nome do projeto não pode estar vazio.";
      }
      if (!isValidDirName(value.trim())) {
        return "Nome inválido. Use apenas letras, números, pontos, hífens e underscores.";
      }
    },
  });
  if (p.isCancel(projectName)) cancelAndExit();

  // 2. Project type
  const projectType = await p.select<ProjectType>({
    message: "Qual tipo de projeto?",
    options: (
      Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]
    ).map(([value, label]) => ({ value, label })),
  });
  if (p.isCancel(projectType)) cancelAndExit();

  // 3. Collect choices based on type
  let backend: BackendChoices | null = null;
  let frontend: FrontendChoices | null = null;

  switch (projectType) {
    case "backend":
      backend = await promptBackend();
      break;

    case "frontend":
      frontend = await promptFrontend();
      break;

    case "fullstack":
      p.log.step(pc.bold("── Backend ──"));
      backend = await promptBackend();
      p.log.step(pc.bold("── Frontend ──"));
      frontend = await promptFrontend();
      break;

    case "mobile": {
      const mobile = await promptMobileFramework();
      let linter: Linter | null = null;
      if (mobile.mobileFramework !== "flutter") {
        const linterChoice = await p.select<Linter>({
          message: "Qual linter/formatter?",
          options: [
            { value: "eslint-prettier" as const, label: "Prettier + ESLint" },
            { value: "biome" as const, label: "Biome" },
          ],
        });
        if (p.isCancel(linterChoice)) cancelAndExit();
        linter = linterChoice;
      }
      frontend = {
        platform: "mobile",
        webFramework: null,
        mobileFramework: mobile.mobileFramework,
        packageManager: mobile.packageManager ?? "npm",
        linter,
      };
      break;
    }
  }

  // 4. Docker
  let includeDocker = false;
  const hasDockerSupport =
    (backend &&
      apiFrameworks.get(backend.apiFramework)?.supportsDocker) ||
    (frontend?.webFramework &&
      webFrameworks.get(frontend.webFramework)?.supportsDocker);

  if (hasDockerSupport) {
    const docker = await p.confirm({
      message: "Incluir Docker?",
    });
    if (p.isCancel(docker)) cancelAndExit();
    includeDocker = docker;
  }

  // 5. CI
  const hasJSFramework =
    (backend && !isPythonFramework(backend.apiFramework)) ||
    frontend?.webFramework ||
    (frontend?.mobileFramework && frontend.mobileFramework !== "flutter");
  const hasPythonFramework = backend && isPythonFramework(backend.apiFramework);
  const showCI = hasJSFramework || hasPythonFramework;

  let includeCI = false;
  if (showCI) {
    const ci = await p.confirm({
      message: "Incluir GitHub Actions CI?",
    });
    if (p.isCancel(ci)) cancelAndExit();
    includeCI = ci;
  }

  p.outro(pc.green("Configuração concluída! Criando projeto..."));

  return {
    projectName: projectName.trim(),
    projectType,
    backend,
    frontend,
    includeDocker,
    includeCI,
  };
}
