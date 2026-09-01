"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { OverviewRecentTasks } from "@/app/components/portal/OverviewRecentTasks";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";
import TradeOnboarding from "@/app/components/contractor/TradeOnboarding";
import type { TaskWithRelations } from "@/lib/types";

interface HouseProject {
  name: string;
  phase: string | null;
  gateCode: string | null;
  contacts: { id: string; name: string; role: string; phone: string }[];
}

export default function ContractorOverviewPage() {
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [house, setHouse] = useState<HouseProject | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading || !contractor || tradeNames.length === 0) return;

    (async () => {
      try {
        const [tasksRes, docsRes, photosRes, houseRes] = await Promise.all([
          fetch("/api/contractor/tasks"),
          fetch("/api/documents"),
          fetch("/api/photos"),
          fetch("/api/projects/house"),
        ]);
        const [tasksData, docsData, photosData, houseData] = await Promise.all([
          tasksRes.json(),
          docsRes.json(),
          photosRes.json(),
          houseRes.json(),
        ]);

        if (tasksData.success) setTasks(tasksData.data);

        if (docsData.success) {
          const visible = docsData.data.filter(
            (d: { specification?: { trade: string } | null }) =>
              !d.specification || tradeNames.includes(d.specification.trade)
          );
          setDocumentCount(visible.length);
        }

        if (photosData.success) setPhotoCount(photosData.data.length);
        if (houseData.success) setHouse(houseData.data);
      } finally {
        setLoadingData(false);
      }
    })();
  }, [authLoading, contractor, tradeNames]);

  if (authLoading || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (tradeNames.length === 0) {
    return (
      <TradeOnboarding
        companyName={contractor.companyName}
        onDone={() => window.location.reload()}
      />
    );
  }

  const openTasks = tasks.filter((t) => t.status !== "completed");
  const urgentCount = openTasks.filter((t) => t.priority === "high" || t.priority === "critical").length;
  const recentTasks = tasks.slice(0, 4);
  const tradeLabel = tradeNames.join(", ");

  return (
    <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeLabel}>
      <PortalHeader
        projectName={house?.name ?? "Nemetz Residence"}
        pageTitle="Overview"
        phase={house?.phase}
      />

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 30 }}>
            <StatCard value={openTasks.length} label="Open Tasks" />
            <StatCard value={urgentCount} label="Urgent" />
            <StatCard value={documentCount} label="Documents" />
            <StatCard value={photoCount} label="Photos" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>Recent tasks</h2>
              <OverviewRecentTasks initialTasks={recentTasks} canAct />
            </div>
            <div>
              <h2 style={{ fontSize: 16, marginBottom: 12 }}>Site Info</h2>
              {house?.gateCode && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card-kicker">Gate Code</div>
                  <div className="card-title" style={{ fontSize: 24, marginTop: 4 }}>
                    {house.gateCode}
                  </div>
                </div>
              )}
              {house?.contacts && house.contacts.length > 0 && (
                <div className="card">
                  <div className="card-kicker">Contacts</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                    {house.contacts.slice(0, 2).map((c) => (
                      <div key={c.id}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                        <div className="card-meta">
                          {c.role} · {c.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </PortalShell>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="card-title" style={{ fontSize: 28 }}>
        {value}
      </div>
      <div className="card-meta" style={{ marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}
