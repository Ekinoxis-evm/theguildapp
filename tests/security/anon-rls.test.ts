// Anonymous-access RLS probes. Read-only: they connect with the public
// publishable key (exactly what any visitor has in their browser) and assert
// that Row Level Security exposes nothing sensitive and rejects writes.
//
// Runs against the project in NEXT_PUBLIC_SUPABASE_URL — .env.local locally.
// These hit the network: `pnpm test:security` (excluded from `pnpm test`).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

function loadEnv(name: string): string {
  if (process.env[name]) return process.env[name]!;
  const envFile = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  const line = envFile
    .split("\n")
    .find((l) => l.startsWith(`${name}=`) && l.split("=")[1]?.trim());
  const value = line?.slice(name.length + 1).trim();
  if (!value) throw new Error(`${name} not set (env or .env.local)`);
  return value;
}

let anon: SupabaseClient<Database>;

beforeAll(() => {
  anon = createClient<Database>(
    loadEnv("NEXT_PUBLIC_SUPABASE_URL"),
    loadEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
});

// Every table that must return ZERO rows to an anonymous visitor.
const FULLY_PRIVATE_TABLES = [
  "profiles", // PII: names, phones, tiers, Stripe ids
  "client_addresses", // most sensitive: exact street addresses
  "style_photos",
  "legal_acceptances",
  "bookings", // includes address snapshots + payment columns
  "b2b_leads",
  "event_registrations",
  "barbershop_staff",
] as const;

describe("anonymous reads", () => {
  for (const table of FULLY_PRIVATE_TABLES) {
    it(`${table}: returns no rows`, async () => {
      const { data, error } = await anon.from(table).select("*").limit(5);
      // RLS either errors or silently filters — both acceptable; rows are not.
      expect(error ?? null).toBeDefined();
      expect(data ?? []).toHaveLength(0);
    });
  }

  it("private_barbers: never leaks unapproved applicants", async () => {
    const { data } = await anon
      .from("private_barbers")
      .select("profile_id, status")
      .neq("status", "approved")
      .limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  it("barber_certifications: hidden from anonymous visitors", async () => {
    const { data } = await anon
      .from("barber_certifications")
      .select("id, file_path")
      .limit(5);
    expect(data ?? []).toHaveLength(0);
  });

  it("barber_affiliations: hidden from anonymous visitors", async () => {
    const { data } = await anon.from("barber_affiliations").select("id").limit(5);
    expect(data ?? []).toHaveLength(0);
  });
});

describe("anonymous writes are rejected", () => {
  it("cannot insert a booking", async () => {
    const { error } = await anon.from("bookings").insert({
      client_id: "00000000-0000-0000-0000-000000000000",
      service_id: "00000000-0000-0000-0000-000000000000",
      scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
      duration_minutes: 30,
      style_confirmed_at: new Date().toISOString(),
    });
    expect(error).not.toBeNull();
  });

  it("cannot grant itself a profile", async () => {
    const { error } = await anon.from("profiles").insert({
      id: "00000000-0000-0000-0000-000000000000",
      tier: "premium",
    });
    expect(error).not.toBeNull();
  });

  it("cannot call admin RPCs", async () => {
    const { error } = await anon.rpc("set_client_tier", {
      user_email: "attacker@example.com",
      new_tier: "premium",
    });
    expect(error).not.toBeNull();
  });

  it("cannot verify certifications", async () => {
    const { error } = await anon.rpc("verify_certification", {
      cert_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("cannot read the staff directory (signed-in only)", async () => {
    const { data, error } = await anon.rpc("shop_staff_directory", {
      p_shop_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("cannot read barber service history (signed-in only)", async () => {
    const { data, error } = await anon.rpc("barber_service_history", {
      p_barber_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});

describe("storage buckets stay private", () => {
  for (const bucket of [
    "style-photos",
    "avatars",
    "barber-photos",
    "barber-certs",
  ] as const) {
    it(`${bucket}: anonymous listing returns nothing`, async () => {
      const { data, error } = await anon.storage.from(bucket).list();
      expect(error ?? null).toBeDefined();
      expect(data ?? []).toHaveLength(0);
    });
  }
});
