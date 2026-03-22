import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { performInit } from "../src/cli/init";

describe("performInit", () => {
  it("creates component and merges locale keys without overwriting", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "crw-init-"));

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

    await mkdir(path.join(root, "src", "locales", "en"), { recursive: true });

    await writeFile(
      path.join(root, "src", "locales", "en", "complaintRequrestWidget.json"),
      JSON.stringify(
        {
          openWidget: "Custom open",
          custom: "keep"
        },
        null,
        2
      )
    );

    const first = await performInit({ targetDir: root, yes: true, packageName: "@scope/lib" });
    const second = await performInit({ targetDir: root, yes: true, packageName: "@scope/lib" });

    const component = await readFile(first.componentFile, "utf8");
    const enLocale = JSON.parse(await readFile(first.enFile, "utf8")) as Record<string, string>;
    const arLocale = JSON.parse(await readFile(first.arFile, "utf8")) as Record<string, string>;

    expect(first.componentResult).toBe("created");
    expect(second.componentResult).toBe("skipped");
    expect(component).toContain("@scope/lib");
    expect(enLocale.openWidget).toBe("Custom open");
    expect(enLocale.custom).toBe("keep");
    expect(enLocale.submit).toBeTruthy();
    expect(arLocale.submit).toBeTruthy();
  });

  it("rejects path traversal and invalid package names", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "crw-init-sec-"));

    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ name: "host-app", version: "1.0.0" }, null, 2)
    );

    await expect(
      performInit({
        targetDir: root,
        yes: true,
        componentsPath: "../outside"
      })
    ).rejects.toThrow(/outside target directory/i);

    await expect(
      performInit({
        targetDir: root,
        yes: true,
        packageName: "bad package name"
      })
    ).rejects.toThrow(/invalid package name/i);
  });
});
