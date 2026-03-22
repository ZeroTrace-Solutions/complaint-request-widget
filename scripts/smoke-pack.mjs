import { existsSync, rmSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const exampleDir = path.join(rootDir, "example");

function run(command, cwd = rootDir) {
  execSync(command, {
    cwd,
    stdio: "inherit"
  });
}

function output(command, cwd = rootDir) {
  return execSync(command, {
    cwd,
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8"
  }).trim();
}

run("npm run build");
const tarballName = output("npm pack --silent").split(/\r?\n/).at(-1);

if (!tarballName) {
  throw new Error("Failed to produce npm tarball.");
}

const tarballPath = path.join(rootDir, tarballName);

if (existsSync(path.join(exampleDir, "node_modules"))) {
  rmSync(path.join(exampleDir, "node_modules"), { recursive: true, force: true });
}
if (existsSync(path.join(exampleDir, "package-lock.json"))) {
  rmSync(path.join(exampleDir, "package-lock.json"), { force: true });
}

run("npm install", exampleDir);
run(`npm install --no-save "${tarballPath}"`, exampleDir);
run("npm run build", exampleDir);

if (existsSync(tarballPath)) {
  unlinkSync(tarballPath);
}

console.log("Consumer smoke test passed.");
