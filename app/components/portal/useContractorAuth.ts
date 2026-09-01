"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Contractor {
  id: string;
  email: string;
  companyName: string;
}

interface ContractorAuthState {
  loading: boolean;
  contractor: Contractor | null;
  /** Names of every trade this contractor is registered under. */
  tradeNames: string[];
}

// Shared by every authenticated /contractor/* page: confirms the session,
// loads the contractor's registered trades (for scoping + the sidebar's
// "{trade} trade" tag), and bounces to login on failure - the same
// self-check pattern ContractorDashboard already used per-page.
export function useContractorAuth(): ContractorAuthState {
  const router = useRouter();
  const [state, setState] = useState<ContractorAuthState>({
    loading: true,
    contractor: null,
    tradeNames: [],
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const meRes = await fetch("/api/auth/contractor/me");
        if (!meRes.ok) {
          router.push("/contractor/login");
          return;
        }
        const meData = await meRes.json();

        const tradesRes = await fetch("/api/contractor/trades");
        const tradesData = tradesRes.ok ? await tradesRes.json() : { trades: [] };

        // Track portal access time for bid reminders (see
        // app/api/cron/send-bid-reminders) - silent fire-and-forget.
        fetch("/api/contractor/track-access", { method: "POST" }).catch(() => {});

        if (!cancelled) {
          setState({
            loading: false,
            contractor: meData.data,
            tradeNames: (tradesData.trades || []).map((t: { name: string }) => t.name),
          });
        }
      } catch {
        if (!cancelled) router.push("/contractor/login");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return state;
}
