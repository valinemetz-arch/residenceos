"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { ReferenceExplorer } from "@/app/components/reference/ReferenceExplorer";

interface NamedRef {
  id: string;
  name: string;
}

// "View as [trade]" - lets the owner confirm a trade has access to
// everything it needs without needing a real contractor login. Shows exactly
// what ReferenceExplorer would show that trade (same component, same API,
// same access rules from Trade Access). Tasks, Messages, Bids, and Contracts
// aren't simulated here since those belong to one specific contractor's
// account, not a trade in the abstract - there's no generic "this trade's
// messages" to preview.
export default function ViewAsTradePage() {
  const params = useParams();
  const tradeId = params.tradeId as string;
  const [trade, setTrade] = useState<NamedRef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/trades");
      const data = await res.json();
      const found = (data.trades || []).find((t: NamedRef) => t.id === tradeId) || null;
      setTrade(found);
      setLoading(false);
    })();
  }, [tradeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!trade) {
    return <p className="card-meta">Trade not found.</p>;
  }

  return (
    <div>
      <Link href="/app/trade-access" className="btn btn-icon" style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} strokeWidth={1.8} />
      </Link>
      <PortalHeader projectName="Nemetz Residence" pageTitle={`Preview: ${trade.name}`} />

      <div
        className="card"
        style={{
          marginBottom: 20,
          borderColor: "var(--color-accent)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <Eye size={18} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 2, color: "var(--color-accent-700)" }} />
        <div>
          <p style={{ fontWeight: 600, marginBottom: 2 }}>
            Previewing what any {trade.name} contractor sees
          </p>
          <p className="card-meta">
            This is a simulated view for the {trade.name} trade - not a real contractor login, and it doesn't touch
            any account. Missing something? Go to{" "}
            <Link href="/app/trade-access" style={{ textDecoration: "underline" }}>
              Trade Access
            </Link>{" "}
            and grant it. Tasks, Messages, Bids, and Contracts belong to one specific contractor's account, so
            they're not shown in this generic trade preview.
          </p>
        </div>
      </div>

      <ReferenceExplorer trades={[trade]} />
    </div>
  );
}
