import { readFileSync, writeFileSync } from "node:fs";

const pkgPath = new URL("../package.json", import.meta.url);
const pkgText = readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(pkgText);

const version = String(pkg.version || "");
const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

if (!match) {
  throw new Error(`Unsupported version format: ${version}. Expected major.minor.patch`);
}

const major = Number(match[1]);
const minor = Number(match[2]);

if (!Number.isInteger(major) || !Number.isInteger(minor)) {
  throw new Error(`Invalid version numbers: ${version}`);
}

const nextMajor = minor >= 9 ? major + 1 : major;
const nextMinor = minor >= 9 ? 0 : minor + 1;
const nextVersion = `${nextMajor}.${nextMinor}.0`;

pkg.version = nextVersion;

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`Version bumped: ${version} -> ${nextVersion}`);
