import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { performInit } from "../src/cli/init";

describe("performInit", () => {
  it("creates component and does not generate locale files", async () => {
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

    const first = await performInit({ targetDir: root, yes: true, packageName: "@scope/lib" });
    const second = await performInit({ targetDir: root, yes: true, packageName: "@scope/lib" });

    const component = await readFile(first.componentFile, "utf8");

    expect(first.componentResult).toBe("created");
    expect(second.componentResult).toBe("skipped");
    expect(component).toContain("@scope/lib");

    expect(
      existsSync(path.join(root, "src", "locales", "en", "complaintRequrestWidget.json"))
    ).toBe(false);
    expect(
      existsSync(path.join(root, "src", "locales", "ar", "complaintRequrestWidget.json"))
    ).toBe(false);
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

  it("does not patch host i18n files", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "crw-init-no-patch-"));

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

    await mkdir(path.join(root, "src"), { recursive: true });
    const i18nFile = path.join(root, "src", "i18n.ts");
    const originalI18nSource = [
      'import i18n from "i18next";',
      'import { initReactI18next } from "react-i18next";',
      "",
      "i18n.use(initReactI18next).init({ lng: \"en\", resources: {} });",
      "",
      "export default i18n;",
      ""
    ].join("\n");

    await writeFile(
      i18nFile,
      originalI18nSource
    );

    await performInit({ targetDir: root, yes: true });

    const i18nConfig = await readFile(i18nFile, "utf8");

    expect(i18nConfig).toBe(originalI18nSource);
  });
});
