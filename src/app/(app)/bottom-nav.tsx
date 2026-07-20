"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

// Full-screen moments where navigation would compete with the task.
const HIDDEN_ON = ["/welcome", "/onboarding"];

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-guild-black">
      <div className="mx-auto flex w-full max-w-2xl">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.15em] ${
                active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {active && (
                <span className="absolute inset-x-4 top-0 h-0.5 bg-guild-yellow" />
              )}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
