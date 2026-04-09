// ── Project Types ──────────────────────────────────────────────────────────

export type ProjectType = "backend" | "frontend" | "fullstack" | "mobile";

// ── Framework Types ────────────────────────────────────────────────────────

export type ApiFramework = "express" | "elysiajs" | "flask" | "fastapi" | "django";
export type WebFramework = "nextjs" | "react" | "vue" | "vinext";
export type MobileFramework = "flutter" | "react-native";

/** Union of all frameworks (used for template directory resolution) */
export type Framework = ApiFramework | WebFramework | MobileFramework;

// ── Infrastructure Types ───────────────────────────────────────────────────

export type Database = "postgresql" | "mysql" | "mongodb";
export type ORM = "prisma" | "drizzle" | "sqlalchemy";
export type Cache = "redis";
export type Platform = "web" | "mobile" | "both";

// ── Package Manager & Linter Types ─────────────────────────────────────────

export type PackageManager = "npm" | "bun" | "pnpm" | "yarn";
export type PythonPackageManager = "pip" | "poetry" | "uv";
export type Linter = "eslint-prettier" | "biome";
export type PythonLinter = "ruff";

// ── Framework Configs ──────────────────────────────────────────────────────

export interface ApiFrameworkConfig {
  name: ApiFramework;
  displayName: string;
  packageManagers: PackageManager[] | PythonPackageManager[];
  supportsBetterAuth: boolean;
  supportsDocker: boolean;
  supportedDatabases: Database[];
  supportedORMs: ORM[];
}

export interface WebFrameworkConfig {
  name: WebFramework;
  displayName: string;
  packageManagers: PackageManager[];
  supportsDocker: boolean;
}

export interface MobileFrameworkConfig {
  name: MobileFramework;
  displayName: string;
  packageManagers: PackageManager[];
}

// ── Registries ─────────────────────────────────────────────────────────────

export const apiFrameworks: Map<ApiFramework, ApiFrameworkConfig> = new Map([
  [
    "express",
    {
      name: "express",
      displayName: "Express",
      packageManagers: ["npm", "bun", "pnpm", "yarn"],
      supportsBetterAuth: true,
      supportsDocker: true,
      supportedDatabases: ["postgresql", "mysql", "mongodb"],
      supportedORMs: ["prisma", "drizzle"],
    },
  ],
  [
    "elysiajs",
    {
      name: "elysiajs",
      displayName: "ElysiaJS",
      packageManagers: ["bun"],
      supportsBetterAuth: true,
      supportsDocker: true,
      supportedDatabases: ["postgresql", "mysql", "mongodb"],
      supportedORMs: ["prisma", "drizzle"],
    },
  ],
  [
    "flask",
    {
      name: "flask",
      displayName: "Flask",
      packageManagers: ["pip", "poetry", "uv"],
      supportsBetterAuth: false,
      supportsDocker: true,
      supportedDatabases: ["postgresql", "mysql", "mongodb"],
      supportedORMs: ["sqlalchemy"],
    },
  ],
  [
    "fastapi",
    {
      name: "fastapi",
      displayName: "FastAPI",
      packageManagers: ["pip", "poetry", "uv"],
      supportsBetterAuth: false,
      supportsDocker: true,
      supportedDatabases: ["postgresql", "mysql", "mongodb"],
      supportedORMs: ["sqlalchemy"],
    },
  ],
  [
    "django",
    {
      name: "django",
      displayName: "Django",
      packageManagers: ["pip", "poetry", "uv"],
      supportsBetterAuth: false,
      supportsDocker: true,
      supportedDatabases: ["postgresql", "mysql"],
      supportedORMs: [],
    },
  ],
]);

export const webFrameworks: Map<WebFramework, WebFrameworkConfig> = new Map([
  [
    "nextjs",
    {
      name: "nextjs",
      displayName: "Next.js",
      packageManagers: ["npm", "bun", "pnpm", "yarn"],
      supportsDocker: true,
    },
  ],
  [
    "react",
    {
      name: "react",
      displayName: "React",
      packageManagers: ["npm", "bun", "pnpm", "yarn"],
      supportsDocker: true,
    },
  ],
  [
    "vue",
    {
      name: "vue",
      displayName: "Vue",
      packageManagers: ["npm", "bun", "pnpm", "yarn"],
      supportsDocker: true,
    },
  ],
  [
    "vinext",
    {
      name: "vinext",
      displayName: "Vinext",
      packageManagers: ["npm", "bun", "pnpm", "yarn"],
      supportsDocker: true,
    },
  ],
]);

export const mobileFrameworks: Map<MobileFramework, MobileFrameworkConfig> =
  new Map([
    [
      "flutter",
      {
        name: "flutter",
        displayName: "Flutter",
        packageManagers: [],
      },
    ],
    [
      "react-native",
      {
        name: "react-native",
        displayName: "React Native",
        packageManagers: ["npm", "bun", "pnpm", "yarn"],
      },
    ],
  ]);

// ── Helpers ────────────────────────────────────────────────────────────────

const PYTHON_FRAMEWORKS: ReadonlySet<ApiFramework> = new Set([
  "flask",
  "fastapi",
  "django",
]);

export function isPythonFramework(fw: ApiFramework): boolean {
  return PYTHON_FRAMEWORKS.has(fw);
}

export function getAvailableORMs(
  apiFramework: ApiFramework,
  database: Database | null,
): ORM[] {
  if (!database) return [];
  // Django uses its own ORM
  if (apiFramework === "django") return [];
  const config = apiFrameworks.get(apiFramework);
  if (!config) return [];

  return config.supportedORMs.filter((orm) => {
    // Drizzle does not support MongoDB
    if (orm === "drizzle" && database === "mongodb") return false;
    return true;
  });
}

export function getAvailableDatabases(apiFramework: ApiFramework): Database[] {
  const config = apiFrameworks.get(apiFramework);
  return config?.supportedDatabases ?? [];
}

export function getAvailableLinters(
  apiFramework: ApiFramework,
): (Linter | PythonLinter)[] {
  if (isPythonFramework(apiFramework)) return ["ruff"];
  return ["eslint-prettier", "biome"];
}

export function getAvailablePackageManagers(
  apiFramework: ApiFramework,
): (PackageManager | PythonPackageManager)[] {
  const config = apiFrameworks.get(apiFramework);
  return (config?.packageManagers as (PackageManager | PythonPackageManager)[]) ?? [];
}

export function isPythonPackageManager(
  pm: PackageManager | PythonPackageManager,
): pm is PythonPackageManager {
  return pm === "pip" || pm === "poetry" || pm === "uv";
}

export function getApiFrameworkConfig(
  fw: ApiFramework,
): ApiFrameworkConfig | undefined {
  return apiFrameworks.get(fw);
}

export function getWebFrameworkConfig(
  fw: WebFramework,
): WebFrameworkConfig | undefined {
  return webFrameworks.get(fw);
}

export function getMobileFrameworkConfig(
  fw: MobileFramework,
): MobileFrameworkConfig | undefined {
  return mobileFrameworks.get(fw);
}
