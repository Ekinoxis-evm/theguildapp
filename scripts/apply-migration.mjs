// Apply a local migration file to the linked Supabase project via the
// Management API (same endpoint the Supabase MCP uses). Fallback for when
// the CLI's db push cannot run (no DB password on this machine).
// Usage: SUPABASE_ACCESS_TOKEN=... node scripts/apply-migration.mjs <file> <name>
import { readFileSync } from "node:fs";

const [file, name] = process.argv.slice(2);
const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = "jkpxoasqextvneuixzmz";
if (!file || !name || !token) {
  console.error("Usage: SUPABASE_ACCESS_TOKEN=... node scripts/apply-migration.mjs <file> <name>");
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/migrations`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "supabase-cli/2.0 theguildapp-migration",
  },
  body: JSON.stringify({ name, query: readFileSync(file, "utf8") }),
});
console.log(res.status, (await res.text()).slice(0, 600));
process.exit(res.ok ? 0 : 1);
