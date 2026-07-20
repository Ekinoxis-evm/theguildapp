import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n";
import { dict } from "@/lib/dictionaries";
import { LangSwitcher } from "../../lang-switcher";

export const metadata = { title: "Choose your path — The Guild" };

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/welcome");

  const lang = await getLang();
  const t = dict(lang).welcome;

  const doors = [
    { ...t.person, href: "/onboarding", primary: true },
    { ...t.barber, href: "/my-barber", primary: false },
    { ...t.business, href: "/partners", primary: false },
  ];

  return (
    <main className="flex flex-1 flex-col bg-guild-black text-white">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-6">
        <Image
          src="/brand/logo-on-dark.png"
          alt="The Guild"
          width={1005}
          height={362}
          priority
          className="h-7 w-auto"
        />
        <LangSwitcher current={lang} />
      </header>

      <section className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16 pt-10">
        <p className="text-xs uppercase tracking-[0.3em] text-guild-yellow">{t.eyebrow}</p>
        <h1 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-wide sm:text-4xl">
          {t.title}
        </h1>

        <div className="mt-10 flex flex-col gap-4">
          {doors.map((d) => (
            <Link
              key={d.label}
              href={d.href}
              className={
                d.primary
                  ? "group border-2 border-guild-yellow bg-guild-yellow p-5 text-guild-black"
                  : "group border border-neutral-700 p-5 hover:border-white"
              }
            >
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
                  d.primary ? "text-guild-black/70" : "text-neutral-500"
                }`}
              >
                {d.label}
              </p>
              <h2 className="mt-2 font-display text-xl font-extrabold uppercase tracking-wide">
                {d.title}
              </h2>
              <p
                className={`mt-2 text-sm leading-6 ${
                  d.primary ? "text-guild-black/80" : "text-neutral-400"
                }`}
              >
                {d.blurb}
              </p>
              <p className="mt-3 text-sm font-bold uppercase tracking-widest">
                {d.cta} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-2xl px-6 pb-10">
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-xs text-neutral-500 underline">
            {t.signOut}
          </button>
        </form>
      </footer>
    </main>
  );
}
