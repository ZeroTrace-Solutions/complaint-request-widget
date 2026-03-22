import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { mergeMissingDeep } from "./jsonMerge";
import { componentTemplate, localeTemplateAr, localeTemplateEn } from "./templates";
import { WIDGET_NAMESPACE } from "../locales";

const RECOMMENDED_DEPENDENCIES = ["react", "react-dom", "tailwindcss"];

type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;

export interface InitOptions {
  targetDir?: string;
  packageManager?: PackageManager;
  install?: boolean;
  yes?: boolean;
  componentsPath?: string;
  localeRoot?: string;
  packageName?: string;
}

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  if (!existsSync(filePath)) {
    return null;
  }

  const text = await readFile(filePath, "utf8");
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid JSON file: ${filePath}. ${error instanceof Error ? error.message : ""}`);
  }
}

function resolveInsideRoot(rootDir: string, userPath: string): string {
  const normalized = userPath.replace(/\\/g, "/").trim();
  if (!normalized) {
    throw new Error("Path value cannot be empty.");
  }

  const resolved = path.resolve(rootDir, normalized);
  const relative = path.relative(rootDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside target directory: ${userPath}`);
  }
  return resolved;
}

function validatePackageName(packageName: string): string {
  const value = packageName.trim();
  if (!PACKAGE_NAME_PATTERN.test(value)) {
    throw new Error(`Invalid package name: ${packageName}`);
  }
  return value;
}

async function writeJsonFile(filePath: string, value: Record<string, unknown>) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeIfMissing(filePath: string, content: string): Promise<"created" | "skipped"> {
  if (existsSync(filePath)) {
    return "skipped";
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
  return "created";
}

function detectPackageManager(rootDir: string, preferred?: PackageManager): PackageManager {
  if (preferred) {
    return preferred;
  }

  if (existsSync(path.join(rootDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(path.join(rootDir, "yarn.lock"))) {
    return "yarn";
  }
  if (existsSync(path.join(rootDir, "bun.lockb"))) {
    return "bun";
  }
  return "npm";
}

function missingDependencies(pkg: Record<string, unknown> | null): string[] {
  if (!pkg) {
    return RECOMMENDED_DEPENDENCIES;
  }

  const deps = {
    ...((pkg.dependencies as Record<string, string>) ?? {}),
    ...((pkg.devDependencies as Record<string, string>) ?? {}),
    ...((pkg.peerDependencies as Record<string, string>) ?? {})
  };

  return RECOMMENDED_DEPENDENCIES.filter((dependency) => !(dependency in deps));
}

async function shouldInstall(missing: string[], yes = false, install = false): Promise<boolean> {
  if (!missing.length) {
    return false;
  }

  if (install || yes) {
    return true;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `Missing recommended dependencies: ${missing.join(", ")}. Install now? (y/N): `
  );
  rl.close();

  return answer.trim().toLowerCase() === "y";
}

function installDependencies(rootDir: string, manager: PackageManager, deps: string[]) {
  if (!deps.length) {
    return;
  }

  const installCommand =
    manager === "pnpm"
      ? `pnpm add ${deps.join(" ")}`
      : manager === "yarn"
        ? `yarn add ${deps.join(" ")}`
        : manager === "bun"
          ? `bun add ${deps.join(" ")}`
          : `npm install ${deps.join(" ")}`;

  execSync(installCommand, {
    cwd: rootDir,
    stdio: "inherit"
  });
}

export async function performInit(options: InitOptions = {}) {
  const rootDir = path.resolve(options.targetDir ?? process.cwd());
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = await readJsonFile(packageJsonPath);

  const packageName = validatePackageName(
    options.packageName ?? "@zerotrace-solutions/complaint-request-widget"
  );
  const componentsPath = options.componentsPath ?? "src/components/ui";
  const localeRoot = options.localeRoot ?? "src/locales";

  const componentFile = path.join(resolveInsideRoot(rootDir, componentsPath), "complaint-widget.tsx");
  const enFile = path.join(resolveInsideRoot(rootDir, localeRoot), "en", `${WIDGET_NAMESPACE}.json`);
  const arFile = path.join(resolveInsideRoot(rootDir, localeRoot), "ar", `${WIDGET_NAMESPACE}.json`);

  const componentResult = await writeIfMissing(componentFile, componentTemplate(packageName));

  const enCurrent = (await readJsonFile(enFile)) ?? {};
  const arCurrent = (await readJsonFile(arFile)) ?? {};
  const enMerged = mergeMissingDeep(enCurrent, localeTemplateEn);
  const arMerged = mergeMissingDeep(arCurrent, localeTemplateAr);

  await writeJsonFile(enFile, enMerged);
  await writeJsonFile(arFile, arMerged);

  const manager = detectPackageManager(rootDir, options.packageManager);
  const missing = missingDependencies(packageJson);
  const install = await shouldInstall(missing, options.yes, options.install);

  if (install) {
    installDependencies(rootDir, manager, missing);
  }

  return {
    rootDir,
    componentFile,
    enFile,
    arFile,
    componentResult,
    installedDependencies: install ? missing : []
  };
}
