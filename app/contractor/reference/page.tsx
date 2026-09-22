"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { ReferenceExplorer } from "@/app/components/reference/ReferenceExplorer";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";

interface NamedRef {
  id: string;
  name: string;
}

// Field Reference: the page a contractor pulls up once they're on site,
// after being assigned a trade - every asset and spec/elevation sheet for
// their trade(s), or (switching to "By Space") everything installed in a
// given room across every trade, so they can double-check what the plumber
// or electrician was supposed to do there too.
export default function ContractorReferencePage() {
  const { loading: authLoading, contractor } = useContractorAuth();
  const [trades, setTrades] = useState<NamedRef[]>([]);
  const [houseName, setHouseName] = useState("Nemetz Residence");
  const [phase, setPhase] = useState<string | null>(null);
  const [loadingTrades, setLoadingTrades] = useState(true);

  useEffect(() => {
    if (authLoading || !contractor) return;
    (async () => {
      const [tradesRes, houseRes] = await Promise.all([
        fetch("/api/contractor/trades"),
        fetch("/api/projects/house"),
      ]);
      const tradesData = await tradesRes.json();
      const houseData = await houseRes.json();
      setTrades(tradesData.trades || []);
      if (houseData.success) {
        setHouseName(houseData.data.name);
        setPhase(houseData.data.phase);
      }
      setLoadingTrades(false);
    })();
  }, [authLoading, contractor]);

  if (authLoading || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PortalShell role="contractor" identityName={contractor.companyName} trade={trades.map((t) => t.name).join(", ")}>
      <PortalHeader projectName={houseName} pageTitle="Field Reference" phase={phase} />

      {loadingTrades ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : trades.length === 0 ? (
        <p className="card-meta">You haven't been assigned a trade yet - contact the project owner.</p>
      ) : (
        <ReferenceExplorer trades={trades} />
      )}
    </PortalShell>
  );
}
