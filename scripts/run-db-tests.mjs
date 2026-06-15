import { spawnSync } from "node:child_process";
import { join } from "node:path";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://garageos:garageos@localhost:5432/garageos_test?schema=public";

const reset = spawnSync(process.execPath, ["scripts/reset-test-db.mjs"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

if (reset.status !== 0) {
  process.exit(reset.status ?? 1);
}

const command = join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vitest.cmd" : "vitest"
);
const tests = spawnSync(command, ["run", "tests/db"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    RUN_DATABASE_TESTS: "1",
  },
  shell: process.platform === "win32",
});

process.exit(tests.status ?? 1);
