import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      locales: "src/locales.ts"
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: false,
    external: ["react", "react-dom"]
  },
  {
    entry: {
      cli: "src/cli/index.ts"
    },
    format: ["cjs"],
    dts: false,
    sourcemap: true,
    clean: false,
    banner: {
      js: "#!/usr/bin/env node"
    }
  }
]);
