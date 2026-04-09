import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  type ProjectType,
  type Framework,
  type PackageManager,
  type Linter,
  getFrameworksByType,
  getFrameworkConfig,
} from "./templates.js";

export interface UserChoices {
  projectName: string;
  projectType: ProjectType;
  framework: Framework;
  packageManager: PackageManager | null;
  linter: Linter | null;
  includeBetterAuth: boolean;
  includeDocker: boolean;
  includeCI: boolean;
}

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  backend: "Backend",
  frontend: "Frontend",
  fullstack: "Fullstack",
  mobile: "Mobile",
};

function isValidDirName(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

function cancelAndExit(): never {
  p.cancel("Operação cancelada.");
  process.exit(0);
}

export async function runPrompts(): Promise<UserChoices> {
  p.intro(pc.bgCyan(pc.black(" 🚀 @atnexuslab/create-app ")));

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

  const projectType = await p.select<ProjectType>({
    message: "Qual tipo de projeto?",
    options: (
      Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]
    ).map(([value, label]) => ({ value, label })),
  });
  if (p.isCancel(projectType)) cancelAndExit();

  const availableFrameworks = getFrameworksByType(projectType);
  const framework = await p.select<Framework>({
    message: "Qual framework?",
    options: availableFrameworks.map((f) => ({
      value: f.name,
      label: f.displayName,
    })),
  });
  if (p.isCancel(framework)) cancelAndExit();

  const config = getFrameworkConfig(framework);

  let packageManager: PackageManager | null = null;
  if (config.packageManagers.length === 1) {
    packageManager = config.packageManagers[0];
    p.log.info(`Gerenciador de pacotes: ${pc.cyan(packageManager)}`);
  } else if (config.packageManagers.length > 1) {
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

  let linter: Linter | null = null;
  if (framework !== "flutter") {
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

  let includeBetterAuth = false;
  if (config.supportsBetterAuth) {
    const auth = await p.confirm({
      message: "Incluir Better Auth?",
    });
    if (p.isCancel(auth)) cancelAndExit();
    includeBetterAuth = auth;
  }

  let includeDocker = false;
  if (config.supportsDocker) {
    const docker = await p.confirm({
      message: "Incluir Docker?",
    });
    if (p.isCancel(docker)) cancelAndExit();
    includeDocker = docker;
  }

  let includeCI = false;
  if (framework !== "flutter") {
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
    framework,
    packageManager,
    linter,
    includeBetterAuth,
    includeDocker,
    includeCI,
  };
}
