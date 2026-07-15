"use server";

import { cookies } from "next/headers";

export async function setLang(lang: "en" | "es"): Promise<void> {
  (await cookies()).set("lang", lang === "es" ? "es" : "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
