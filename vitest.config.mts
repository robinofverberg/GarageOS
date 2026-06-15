import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      "server-only": fileURLToPath(
        new URL("./tests/mocks/server-only.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: `${root}coverage`,
    },
  },
});
