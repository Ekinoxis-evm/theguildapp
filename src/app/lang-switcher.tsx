"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLang } from "./lang-actions";
import type { Lang } from "@/lib/i18n";

export function LangSwitcher({ current }: { current: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function pick(lang: Lang) {
    if (lang === current) return;
    startTransition(async () => {
      await setLang(lang);
      router.refresh();
    });
  }

  return (
    <span className="inline-flex gap-1 text-xs">
      {(["en", "es"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => pick(lang)}
          disabled={pending}
          className={
            lang === current
              ? "font-semibold uppercase underline"
              : "uppercase text-neutral-500 hover:underline disabled:opacity-50"
          }
        >
          {lang}
        </button>
      ))}
    </span>
  );
}
