export type ProjectType = "backend" | "frontend" | "fullstack" | "mobile";
export type Framework =
  | "elysiajs"
  | "express"
  | "react"
  | "vue"
  | "nextjs"
  | "vinext"
  | "flutter"
  | "react-native";
export type PackageManager = "npm" | "bun";
export type Linter = "eslint-prettier" | "biome";

export interface FrameworkConfig {
  name: Framework;
  displayName: string;
  type: ProjectType;
  packageManagers: PackageManager[];
  supportsBetterAuth: boolean;
  supportsDocker: boolean;
  supportsVite: boolean;
}

export const frameworks: Map<Framework, FrameworkConfig> = new Map([
  [
    "elysiajs",
    {
      name: "elysiajs",
      displayName: "ElysiaJS",
      type: "backend",
      packageManagers: ["bun"],
      supportsBetterAuth: true,
      supportsDocker: true,
      supportsVite: false,
    },
  ],
  [
    "express",
    {
      name: "express",
      displayName: "ExpressJS",
      type: "backend",
      packageManagers: ["npm", "bun"],
      supportsBetterAuth: true,
      supportsDocker: true,
      supportsVite: false,
    },
  ],
  [
    "react",
    {
      name: "react",
      displayName: "React",
      type: "frontend",
      packageManagers: ["npm", "bun"],
      supportsBetterAuth: false,
      supportsDocker: true,
      supportsVite: true,
    },
  ],
  [
    "vue",
    {
      name: "vue",
      displayName: "Vue",
      type: "frontend",
      packageManagers: ["npm", "bun"],
      supportsBetterAuth: false,
      supportsDocker: true,
      supportsVite: true,
    },
  ],
  [
    "nextjs",
    {
      name: "nextjs",
      displayName: "NextJS",
      type: "fullstack",
      packageManagers: ["npm", "bun"],
      supportsBetterAuth: true,
      supportsDocker: true,
      supportsVite: false,
    },
  ],
  [
    "vinext",
    {
      name: "vinext",
      displayName: "Vinext",
      type: "fullstack",
      packageManagers: ["npm", "bun"],
      supportsBetterAuth: true,
      supportsDocker: true,
      supportsVite: true,
    },
  ],
  [
    "flutter",
    {
      name: "flutter",
      displayName: "Flutter",
      type: "mobile",
      packageManagers: [],
      supportsBetterAuth: false,
      supportsDocker: true,
      supportsVite: false,
    },
  ],
  [
    "react-native",
    {
      name: "react-native",
      displayName: "React Native",
      type: "mobile",
      packageManagers: ["npm", "bun"],
      supportsBetterAuth: false,
      supportsDocker: false,
      supportsVite: false,
    },
  ],
]);

export function getFrameworksByType(type: ProjectType): FrameworkConfig[] {
  return [...frameworks.values()].filter((f) => f.type === type);
}

export function getFrameworkConfig(framework: Framework): FrameworkConfig {
  const config = frameworks.get(framework);
  if (!config) {
    throw new Error(`Unknown framework: ${framework}`);
  }
  return config;
}
