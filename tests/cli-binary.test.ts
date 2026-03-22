import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("cli binary", () => {
  it("runs init command end-to-end from built binary", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "crw-cli-bin-"));
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
      "--package-name",
      "@zerotrace-solutions/complaint-request-widget"
    ]);

    const component = await readFile(
      path.join(root, "src", "components", "ui", "complaint-widget.tsx"),
      "utf8"
    );
    const enLocale = JSON.parse(
      await readFile(
        path.join(root, "src", "locales", "en", "complaintRequrestWidget.json"),
        "utf8"
      )
    ) as Record<string, string>;

    expect(component).toContain("ComplaintRequestWidget");
    expect(enLocale.submit).toBeTruthy();
    expect(enLocale.trigger).toBeTruthy();
  });
});
