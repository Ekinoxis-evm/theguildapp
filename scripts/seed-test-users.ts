/**
 * Seed one test account per role so the founder can sign in and exercise
 * every role's UI. All emails are Gmail plus-aliases of the founder's
 * inbox, so the OTP codes for every account arrive at ekinoxis.evm@gmail.com.
 *
 * Idempotent: safe to re-run; existing users/rows are updated, not duplicated.
 *
 * Run:  pnpm seed:test-users
 * Env:  NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (read from .env.local)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of file.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Passwords let testers without access to the founder inbox sign in
// ("Sign in with password" on /login). Admin gets its own, never shared.
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env.local`);
  return v;
}
const testerPassword = requireEnv("TEST_USER_PASSWORD");
const adminPassword = requireEnv("TEST_ADMIN_PASSWORD");

const LEGAL_VERSIONS = { terms: "2026-07-08.v1", privacy: "2026-07-08.v1" };

type Role = "client" | "barbershop_owner" | "private_barber" | "event_manager" | "admin";

const TEST_USERS: Array<{
  email: string;
  role: Role;
  tier?: "standard" | "premium";
  first_name: string;
  last_name: string;
}> = [
  { email: "ekinoxis.evm+client@gmail.com", role: "client", tier: "standard", first_name: "Test", last_name: "Client" },
  { email: "ekinoxis.evm+premium@gmail.com", role: "client", tier: "premium", first_name: "Test", last_name: "Premium" },
  { email: "ekinoxis.evm+shop@gmail.com", role: "barbershop_owner", first_name: "Test", last_name: "ShopOwner" },
  { email: "ekinoxis.evm+barber@gmail.com", role: "private_barber", first_name: "Test", last_name: "Barber" },
  { email: "ekinoxis.evm+events@gmail.com", role: "event_manager", first_name: "Test", last_name: "EventManager" },
  { email: "ekinoxis.evm+admin@gmail.com", role: "admin", first_name: "Test", last_name: "Admin" },
];

async function findUserByEmail(email: string): Promise<string | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 100) return null;
  }
  return null;
}

async function ensureUser(email: string, password: string): Promise<string> {
  const existing = await findUserByEmail(email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing, { password });
    if (error) throw error;
    console.log(`  auth user exists (password refreshed): ${email}`);
    return existing;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`  auth user created: ${email}`);
  return data.user.id;
}

async function ensureLegal(profileId: string) {
  for (const doc of ["terms", "privacy"] as const) {
    const { data } = await admin
      .from("legal_acceptances")
      .select("id")
      .eq("profile_id", profileId)
      .eq("document", doc)
      .eq("version", LEGAL_VERSIONS[doc])
      .maybeSingle();
    if (!data) {
      const { error } = await admin
        .from("legal_acceptances")
        .insert({ profile_id: profileId, document: doc, version: LEGAL_VERSIONS[doc] });
      if (error) throw error;
    }
  }
}

async function main() {
  const ids: Record<string, string> = {};

  for (const u of TEST_USERS) {
    console.log(`\n${u.role}${u.tier ? ` (${u.tier})` : ""} — ${u.email}`);
    const id = await ensureUser(u.email, u.role === "admin" ? adminPassword : testerPassword);
    ids[u.email] = id;

    const { error } = await admin
      .from("profiles")
      .update({
        role: u.role,
        tier: u.tier ?? "standard",
        first_name: u.first_name,
        last_name: u.last_name,
        phone: "+13050000000",
        haircut_method: "mixed",
        country: "US",
        state: "FL",
        city: "Miami",
        zip_code: "33130",
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
    await ensureLegal(id);
    console.log("  profile + legal acceptances ready");
  }

  // ── Sample barbershop for the owner account ────────────────────────────────
  const ownerId = ids["ekinoxis.evm+shop@gmail.com"];
  let { data: shop } = await admin
    .from("barbershops")
    .select("id")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!shop) {
    const { data, error } = await admin
      .from("barbershops")
      .insert({
        owner_id: ownerId,
        name: "Guild Test Barbershop",
        phone: "+13050000001",
        description: "Seeded test shop — safe to edit or delete.",
        status: "approved",
      })
      .select("id")
      .single();
    if (error) throw error;
    shop = data;
  } else {
    await admin.from("barbershops").update({ status: "approved" }).eq("id", shop.id);
  }
  console.log(`\nbarbershop ready: ${shop.id}`);

  const { data: loc } = await admin
    .from("barbershop_locations")
    .select("id")
    .eq("barbershop_id", shop.id)
    .maybeSingle();
  if (!loc) {
    const { error } = await admin.from("barbershop_locations").insert({
      barbershop_id: shop.id,
      formatted_address: "1111 SW 1st Ave, Miami, FL 33130, USA",
      lat: 25.7663,
      lng: -80.1949,
      country: "US",
      state: "FL",
      city: "Miami",
      zip_code: "33130",
    });
    if (error) throw error;
  }

  const { count: svcCount } = await admin
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("barbershop_id", shop.id);
  if (!svcCount) {
    const { error } = await admin.from("services").insert([
      { barbershop_id: shop.id, name: "Classic cut", price_cents: 3500, duration_minutes: 30 },
      { barbershop_id: shop.id, name: "Cut + beard", price_cents: 5000, duration_minutes: 45 },
    ]);
    if (error) throw error;
  }

  // Staff row using the barber alias → also exercises staff↔account linking.
  const { count: staffCount } = await admin
    .from("barbershop_staff")
    .select("id", { count: "exact", head: true })
    .eq("barbershop_id", shop.id);
  if (!staffCount) {
    const { error } = await admin.from("barbershop_staff").insert({
      barbershop_id: shop.id,
      full_name: "Test Barber",
      email: "ekinoxis.evm+barber@gmail.com",
      phone: "+13050000002",
      skills: ["barber"],
    });
    if (error) throw error;
  }
  console.log("  location, services, staff ready");

  // ── Sample private barber profile ──────────────────────────────────────────
  const barberId = ids["ekinoxis.evm+barber@gmail.com"];
  const { data: pb } = await admin
    .from("private_barbers")
    .select("profile_id")
    .eq("profile_id", barberId)
    .maybeSingle();
  if (!pb) {
    const { error } = await admin.from("private_barbers").insert({
      profile_id: barberId,
      bio: "Seeded test barber profile — safe to edit.",
      headline: "Master barber · fades & beard sculpting",
      years_experience: 8,
      specialties: ["fades", "beard"],
      base_price_cents: 6000,
      offers_home_service: true,
      status: "approved",
    });
    if (error) throw error;
  } else {
    await admin.from("private_barbers").update({ status: "approved" }).eq("profile_id", barberId);
  }

  const { data: cov } = await admin
    .from("coverage_areas")
    .select("id")
    .eq("private_barber_id", barberId)
    .limit(1);
  if (!cov?.length) {
    const { error } = await admin.from("coverage_areas").insert({
      private_barber_id: barberId,
      country: "US",
      state: "FL",
      city: "Miami",
      zip_codes: ["33130", "33131"],
    });
    if (error) throw error;
  }

  const { count: pbSvc } = await admin
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("private_barber_id", barberId);
  if (!pbSvc) {
    const { error } = await admin.from("services").insert({
      private_barber_id: barberId,
      name: "At-home cut",
      price_cents: 6000,
      duration_minutes: 45,
    });
    if (error) throw error;
  }
  console.log("private barber ready (approved, at-home, coverage: Miami)");

  // ── Sample live event for the event manager ────────────────────────────────
  const mgrId = ids["ekinoxis.evm+events@gmail.com"];
  const { data: ev } = await admin
    .from("events")
    .select("id")
    .eq("manager_id", mgrId)
    .limit(1);
  if (!ev?.length) {
    const starts = new Date();
    starts.setDate(starts.getDate() + 7);
    const ends = new Date(starts);
    ends.setHours(ends.getHours() + 6);
    const { error } = await admin.from("events").insert({
      manager_id: mgrId,
      brand_name: "Guild Test Brand",
      title: "Guild Test Activation",
      venue: "Miami Test Venue",
      starts_at: starts.toISOString(),
      ends_at: ends.toISOString(),
      qr_slug: "guild-test-activation",
      status: "live",
    });
    if (error) throw error;
  }
  console.log("event manager ready (1 live event: /e/guild-test-activation)");

  console.log("\nAll test users seeded. Sign in with any alias — OTP codes arrive at ekinoxis.evm@gmail.com.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
