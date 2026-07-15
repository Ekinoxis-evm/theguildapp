import Link from "next/link";
import { getLang } from "@/lib/i18n";
import { dict } from "@/lib/dictionaries";
import { LangSwitcher } from "./lang-switcher";

export default async function Home() {
  const lang = await getLang();
  const t = dict(lang).home;
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-neutral-950 px-6 py-24 text-center text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-yellow-500">
        {t.tagline}
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
        THE GUILD
      </h1>
      <p className="mt-6 max-w-md text-sm leading-6 text-neutral-400">
        {t.blurb}
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/login"
          className="rounded bg-yellow-500 px-6 py-2.5 text-sm font-medium text-neutral-950"
        >
          {t.cta}
        </Link>
      </div>
      <footer className="mt-24 flex items-center gap-6 text-xs text-neutral-500">
        <Link href="/terms" className="hover:text-neutral-300">
          {t.terms}
        </Link>
        <Link href="/privacy" className="hover:text-neutral-300">
          {t.privacy}
        </Link>
        <LangSwitcher current={lang} />
      </footer>
    </main>
  );
}
