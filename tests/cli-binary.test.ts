import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("cli binary", () => {
  it("runs init command end-to-end from built binary", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "crw-cli-bin-"));
    const npmExecPath = process.env.npm_execpath;
    if (!npmExecPath) {
      throw new Error("npm_execpath is required to build CLI test fixture");
    }

    await execFileAsync(process.execPath, [npmExecPath, "run", "build"], { cwd: process.cwd() });

    const cliPath = path.resolve(process.cwd(), "dist", "cli.cjs");

    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify(
        {
          name: "host-app",
          version: "1.0.0",
          dependencies: {
            react: "19.0.0",
            "react-dom": "19.0.0",
            tailwindcss: "4.0.0"
          }
        },
        null,
        2
      )
    );

    await execFileAsync(process.execPath, [
      cliPath,
      "init",
      "--target-dir",
      root,
      "--yes",
      "--component-ext",
      "jsx",
      "--package-name",
      "@zerotrace-solutions/complaint-request-widget"
    ]);

    const component = await readFile(
      path.join(root, "src", "components", "ui", "complaint-widget.jsx"),
      "utf8"
    );

    expect(component).toContain("ComplaintRequestWidget");
    expect(
      existsSync(path.join(root, "src", "locales", "en", "complaintRequrestWidget.json"))
    ).toBe(false);
    expect(
      existsSync(path.join(root, "src", "locales", "ar", "complaintRequrestWidget.json"))
    ).toBe(false);
  }, 30_000);
});
