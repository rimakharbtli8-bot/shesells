"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/useAppStore";
import { getLevelProgress } from "@/lib/data/levels";

export function Sidebar() {
  const pathname = usePathname();
  const xp = useAppStore((s) => s.xp);
  const streak = useAppStore((s) => s.streak);
  const { current } = getLevelProgress(xp);

  const primaryItems = NAV_ITEMS.filter((item) => item.href !== "/community");

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
          C
        </div>
        <span className="text-lg font-semibold tracking-tight text-ink">CLOSER</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {primaryItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-ink text-white" : "text-ink-soft hover:bg-sand/70",
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/community"
        className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-sm font-semibold text-white shadow-soft transition-transform hover:brightness-105 active:scale-[0.98]"
      >
        <Users size={18} />
        Community
      </Link>

      <div className="rounded-xl bg-sand px-3 py-3">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>Level {current.level}</span>
          <span>🔥 {streak}</span>
        </div>
        <div className="mt-0.5 text-sm font-semibold text-ink">{current.name}</div>
      </div>
    </aside>
  );
}
