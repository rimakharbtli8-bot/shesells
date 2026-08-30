"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useAppStore } from "@/lib/store/useAppStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const onboardingComplete = useAppStore((s) => s.profile.onboardingComplete);

  const isOnboarding = pathname === "/onboarding";

  useEffect(() => {
    if (!hasHydrated) return;
    if (!onboardingComplete && !isOnboarding) {
      router.replace("/onboarding");
    }
  }, [hasHydrated, onboardingComplete, isOnboarding, router]);

  if (isOnboarding) {
    return <>{children}</>;
  }

  if (!hasHydrated || !onboardingComplete) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas" />;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
