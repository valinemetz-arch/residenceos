"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";

interface Bid {
  id: string;
  projectId: string;
  amount: number;
  status: string;
  submittedAt: string;
  project: { id: string; name: string; address: string };
}

const STATUS_CLASS: Record<string, string> = {
  pending: "tag tag-outline",
  approved: "tag tag-neutral",
  rejected: "tag tag-accent",
};

export default function BidsPage() {
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !contractor) return;
    (async () => {
      const res = await fetch("/api/bids/my-bids");
      const data = await res.json();
      if (data.success) setBids(data.data || []);
      setLoading(false);
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
    <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeNames.join(", ")}>
      <PortalHeader projectName="ResidenceOS" pageTitle="Bids" />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : bids.length === 0 ? (
        <p className="card-meta">You haven&apos;t submitted any bids yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th style={{ textAlign: "right" }}>Bid Amount</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => (
              <tr key={bid.id}>
                <td>
                  <Link href={`/contractor/projects/${bid.projectId}`} style={{ fontWeight: 600 }}>
                    {bid.project?.name}
                  </Link>
                </td>
                <td style={{ textAlign: "right" }}>${bid.amount.toLocaleString()}</td>
                <td>
                  <span className={STATUS_CLASS[bid.status] || "tag tag-outline"}>{bid.status}</span>
                </td>
                <td>{new Date(bid.submittedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalShell>
  );
}
