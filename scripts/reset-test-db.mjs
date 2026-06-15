import { spawnSync } from "node:child_process";
import { join } from "node:path";

const fallbackUrl =
  "postgresql://garageos:garageos@localhost:5432/garageos_test?schema=public";
const databaseUrl = process.env.DATABASE_URL ?? fallbackUrl;
const parsed = new URL(databaseUrl);
const databaseName = parsed.pathname.replace(/^\//, "");

if (!/test/i.test(databaseName)) {
  throw new Error(
    `Refusing to reset non-test database "${databaseName}". Set DATABASE_URL to a test database.`
  );
}

const command = join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "prisma.cmd" : "prisma"
);
const result = spawnSync(
  command,
  ["migrate", "reset", "--force"],
  {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
    shell: process.platform === "win32",
  }
);

if (result.error) {
  console.error(result.error);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
