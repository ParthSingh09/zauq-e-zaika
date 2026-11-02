// Local development PostgreSQL (no Docker / Homebrew required).
// Starts a real PostgreSQL server using the `embedded-postgres` package.
// Usage: npm run db:local   (keep it running in a separate terminal)
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dataDir = path.resolve(".local-db");
const port = Number(process.env.LOCAL_DB_PORT || 5433);
const firstRun = !existsSync(path.join(dataDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

if (firstRun) await pg.initialise();
await pg.start();
if (firstRun) {
  try {
    await pg.createDatabase("zauqezaika");
  } catch (e) {
    if (!String(e).includes("already exists")) throw e;
  }
}
console.log(`\n  Local PostgreSQL running on port ${port}`);
console.log(`  DATABASE_URL="postgresql://postgres:postgres@localhost:${port}/zauqezaika"\n`);

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
