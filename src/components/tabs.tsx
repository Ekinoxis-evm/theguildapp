"use client";

import { ReactNode, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type TabItem = { id: string; label: string; content: ReactNode };

// Console tabs: turns a long single-scroll page into sub-pages. The active
// tab syncs to ?tab= so links and back/forward work; the bar scrolls
// horizontally on phones and sticks under the top of the viewport.
function TabsInner({ items, paramName = "tab" }: { items: TabItem[]; paramName?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get(paramName);
  const [active, setActive] = useState(
    items.some((t) => t.id === fromUrl) ? (fromUrl as string) : items[0]?.id
  );

  function select(id: string) {
    setActive(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, id);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="mt-8">
      <div className="sticky top-0 z-30 -mx-6 border-b border-neutral-800 bg-guild-black px-6">
        <div className="flex gap-1 overflow-x-auto">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => select(t.id)}
              aria-selected={active === t.id}
              className={`relative shrink-0 px-3 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-colors ${
                active === t.id ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {active === t.id && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 bg-guild-yellow" />
              )}
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-8">
        {items.map((t) => (
          <div key={t.id} hidden={active !== t.id}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Tabs(props: { items: TabItem[]; paramName?: string }) {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <TabsInner {...props} />
    </Suspense>
  );
}
