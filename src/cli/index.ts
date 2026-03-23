import { Command } from "commander";
import { performInit } from "./init";
import pkg from "../../package.json";

const program = new Command();

program
  .name("complaint-request-widget")
  .description("Initializer for complaint request widget integration")
  .version(pkg.version)
  .command("init")
  .description("Generate host wrapper component")
  .option("-d, --target-dir <dir>", "Host project directory")
  .option("-m, --package-manager <manager>", "npm | pnpm | yarn | bun")
  .option("--install", "Install missing recommended dependencies")
  .option("-y, --yes", "Accept prompts with defaults")
  .option("--components-path <path>", "Path for generated component")
  .option("--package-name <name>", "Library package name used in generated import")
  .option("--component-ext <ext>", "Generated wrapper extension: tsx | jsx")
  .action(async (options) => {
    const result = await performInit({
      targetDir: options.targetDir,
      packageManager: options.packageManager,
      install: options.install,
      yes: options.yes,
      componentsPath: options.componentsPath,
      packageName: options.packageName,
      componentExt: options.componentExt
    });

    console.log("Init complete.");
    console.log(`Component: ${result.componentResult} (${result.componentFile})`);
    if (result.installedDependencies.length) {
      console.log(`Installed: ${result.installedDependencies.join(", ")}`);
    }
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
