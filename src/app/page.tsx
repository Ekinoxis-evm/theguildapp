import Image from "next/image";
import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { dict } from "@/lib/dictionaries";
import { LangSwitcher } from "./lang-switcher";

export default async function Home() {
  const lang = await getLang();
  const t = dict(lang).home;

  const doors = [
    { ...t.doors.clients, href: "/login" },
    { ...t.doors.barbers, href: "/login?next=/my-barber" },
    { ...t.doors.brands, href: "/partners" },
  ];
  const steps = [t.how.s1, t.how.s2, t.how.s3];

  return (
    <main className="flex flex-1 flex-col bg-guild-black text-white">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Image
          src="/brand/logo-on-dark.png"
          alt="The Guild"
          width={1005}
          height={362}
          priority
          className="h-8 w-auto"
        />
        <LangSwitcher current={lang} />
      </header>

      {/* Hero — the doctrine's thesis, verbatim */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-28 sm:pt-24">
        <p className="text-xs uppercase tracking-[0.3em] text-guild-yellow">{t.tagline}</p>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold uppercase leading-[1.02] tracking-wide sm:text-6xl">
          {t.heroA}
          <br />
          <span className="text-guild-yellow">{t.heroB}</span>
        </h1>
        <p className="mt-8 max-w-md text-sm leading-6 text-neutral-400">{t.blurb}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/login"
            className="bg-guild-yellow px-8 py-3.5 text-center text-sm font-bold uppercase tracking-widest text-guild-black"
          >
            {t.ctaBook}
          </Link>
          <Link
            href="/login?next=/my-barber"
            className="border border-neutral-700 px-8 py-3.5 text-center text-sm font-bold uppercase tracking-widest text-white hover:border-white"
          >
            {t.ctaBarber}
          </Link>
        </div>
      </section>

      {/* Three doors — bone surface, entered through the diagonal cut */}
      <section className="guild-cut bg-guild-bone px-6 pb-20 pt-28 text-guild-black">
        <div className="mx-auto grid w-full max-w-5xl gap-12 sm:grid-cols-3 sm:gap-8">
          {doors.map((d) => (
            <div key={d.label} className="flex flex-col">
              <p className="border-l-2 border-guild-yellow pl-3 text-xs font-bold uppercase tracking-[0.25em]">
                {d.label}
              </p>
              <h2 className="mt-4 font-display text-xl font-extrabold uppercase tracking-wide">
                {d.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-neutral-600">{d.blurb}</p>
              <Link
                href={d.href}
                className="mt-5 text-sm font-bold uppercase tracking-widest underline decoration-guild-yellow decoration-2 underline-offset-4"
              >
                {d.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — a real sequence, so it earns its numbers */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500">
          {t.how.title}
        </h2>
        <div className="mt-10 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {steps.map((s, i) => (
            <div key={s.title}>
              <p className="font-display text-5xl font-extrabold text-guild-yellow">
                0{i + 1}
              </p>
              <h3 className="mt-4 font-display text-lg font-extrabold uppercase tracking-wide">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{s.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The filter — the one place yellow is allowed to take the room */}
      <section className="guild-cut bg-guild-yellow px-6 pb-16 pt-24 text-guild-black">
        <div className="mx-auto w-full max-w-5xl">
          <p className="max-w-2xl font-display text-3xl font-extrabold uppercase leading-tight tracking-wide sm:text-4xl">
            {t.filter.line}
          </p>
          <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em]">{t.filter.sub}</p>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-10 text-xs text-neutral-500">
        <Link href="/terms" className="hover:text-neutral-300">
          {t.terms}
        </Link>
        <Link href="/privacy" className="hover:text-neutral-300">
          {t.privacy}
        </Link>
        <Link href="/partners" className="hover:text-neutral-300">
          {t.partners}
        </Link>
        <span className="ml-auto">© 2026 The Guild™</span>
      </footer>
    </main>
  );
}
