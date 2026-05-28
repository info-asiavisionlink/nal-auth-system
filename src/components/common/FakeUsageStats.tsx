"use client";

import { useRef, useSyncExternalStore } from "react";
import {
  computeRegistrationCount,
  computeSessionCount,
} from "@/lib/fake-usage-stats";

type UsageStats = {
  registered: number;
  sessions: number;
};

type FakeUsageStatsProps = {
  className?: string;
};

function StatsSkeleton() {
  return (
    <>
      <span className="inline-block h-3 w-16 animate-pulse rounded bg-sky-100/80" />
      <span className="hidden h-3 w-px bg-sky-200/60 sm:block" aria-hidden />
      <span className="inline-block h-3 w-24 animate-pulse rounded bg-sky-100/80" />
    </>
  );
}

function useFakeUsageStats(): UsageStats | null {
  const cacheRef = useRef<UsageStats | null>(null);

  return useSyncExternalStore(
    () => () => {},
    () => {
      if (cacheRef.current === null) {
        const now = new Date();
        const registered = computeRegistrationCount(now);
        cacheRef.current = {
          registered,
          sessions: computeSessionCount(registered, now),
        };
      }
      return cacheRef.current;
    },
    () => null,
  );
}

export function FakeUsageStats({ className = "" }: FakeUsageStatsProps) {
  const stats = useFakeUsageStats();

  return (
    <aside
      className={`glass-panel pointer-events-none flex max-w-[min(100%,20rem)] flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-xl border border-sky-200/80 bg-white/85 px-3 py-2 text-[10px] font-medium leading-tight text-slate-600 shadow-[0_4px_16px_rgba(14,165,233,0.08)] backdrop-blur-sm sm:justify-end sm:text-[11px] ${className}`}
      aria-label="サービス利用状況"
      aria-live="polite"
    >
      {stats === null ? (
        <>
          <span className="sr-only">計測中</span>
          <StatsSkeleton />
        </>
      ) : (
        <>
          <span className="whitespace-nowrap text-sky-700">
            登録数{" "}
            <span className="font-semibold tabular-nums text-sky-900">
              {stats.registered.toLocaleString()}
            </span>
          </span>
          <span className="hidden h-3 w-px bg-sky-200/70 sm:block" aria-hidden />
          <span className="whitespace-nowrap text-slate-600">
            現在のセッション{" "}
            <span className="font-semibold tabular-nums text-slate-800">
              {stats.sessions.toLocaleString()}
            </span>
          </span>
        </>
      )}
    </aside>
  );
}
