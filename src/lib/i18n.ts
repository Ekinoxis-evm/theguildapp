import { cookies } from "next/headers";

// Cookie-based locale (5.2). English is the fallback everywhere; add new
// strings to BOTH languages in dictionaries.ts — the Dict type enforces it.

export type Lang = "en" | "es";

export async function getLang(): Promise<Lang> {
  return (await cookies()).get("lang")?.value === "es" ? "es" : "en";
}
