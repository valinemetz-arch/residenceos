"use client";

import { useEffect, useState } from "react";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { DocCategoryList } from "@/app/components/portal/DocCategoryList";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";

interface Doc {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number | null;
  space: { id: string; name: string } | null;
  specification: { id: string; trade: string } | null;
}

interface HouseProject {
  name: string;
  phase: string | null;
  gateCode: string | null;
  timelineSteps: { id: string; label: string; dateLabel: string }[];
  contacts: { id: string; name: string; role: string; phone: string }[];
}

export default function ContractorProjectPage() {
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [house, setHouse] = useState<HouseProject | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading || !contractor) return;
    (async () => {
      const [docsRes, houseRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/projects/house"),
      ]);
      const docsData = await docsRes.json();
      const houseData = await houseRes.json();
      if (docsData.success) setDocuments(docsData.data);
      if (houseData.success) setHouse(houseData.data);
      setLoadingData(false);
    })();
  }, [authLoading, contractor]);

  if (authLoading || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // A document with no specification link is visible to every trade
  // (floorplans, site info); otherwise it's scoped to the linked trade.
  const inTrade = (doc: Doc) => !doc.specification || tradeNames.includes(doc.specification.trade);
  const visible = documents.filter(inTrade);

  const renderings = visible.filter((d) => d.type === "rendering");
  const floorplans = visible.filter((d) => d.type === "plan");
  const specifications = visible.filter((d) => d.type === "spec_sheet");
  const takeoffs = visible.filter((d) => d.type === "takeoff");

  return (
    <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeNames.join(", ")}>
      <PortalHeader projectName={house?.name ?? "Nemetz Residence"} pageTitle="Project" phase={house?.phase} />

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28 }}>
          <div>
            {renderings.length > 0 && (
              <div style={{ marginBottom: 26 }}>
                <div
                  style={{
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-accent-700)",
                    marginBottom: 10,
                  }}
                >
                  Room Renderings
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {renderings.map((r) => (
                    <div key={r.id}>
                      <div className="plate" style={{ aspectRatio: "4/3", padding: 0, overflow: "hidden" }}>
                        {r.fileUrl ? (
                          <img src={r.fileUrl} alt={r.name} />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "var(--color-neutral-300)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--color-neutral-600)",
                            }}
                          >
                            <ImageIcon size={22} strokeWidth={1.6} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 5, color: "var(--color-neutral-700)" }}>
                        {r.space?.name ?? r.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DocCategoryList label="Floorplans" docs={floorplans} />
            <DocCategoryList label="Specifications" docs={specifications} />
            <DocCategoryList label="Takeoffs" docs={takeoffs} />

            {renderings.length === 0 && floorplans.length === 0 && specifications.length === 0 && takeoffs.length === 0 && (
              <p className="card-meta">No documents yet.</p>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-accent-700)",
                marginBottom: 10,
              }}
            >
              Site Info
            </div>

            {house?.gateCode && (
              <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
                <div className="card-kicker">Gate Code</div>
                <div className="card-title" style={{ fontSize: 26, marginTop: 4 }}>
                  {house.gateCode}
                </div>
              </div>
            )}

            {house?.timelineSteps && house.timelineSteps.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, marginBottom: 10 }}>Timeline</h3>
                <div style={{ display: "flex", flexDirection: "column", marginBottom: 22 }}>
                  {house.timelineSteps.map((step) => (
                    <div
                      key={step.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--color-divider)",
                        fontSize: 13,
                      }}
                    >
                      <span>{step.label}</span>
                      <span style={{ color: "var(--color-neutral-700)", whiteSpace: "nowrap" }}>{step.dateLabel}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {house?.contacts && house.contacts.length > 0 && (
              <>
                <h3 style={{ fontSize: 14, marginBottom: 10 }}>Contacts</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {house.contacts.map((c) => (
                    <div key={c.id} className="card">
                      <div className="card-title" style={{ fontSize: 15 }}>
                        {c.name}
                      </div>
                      <div className="card-meta" style={{ marginTop: 2 }}>
                        {c.role}
                      </div>
                      <div style={{ fontSize: 13, marginTop: 6, color: "var(--color-accent-700)" }}>{c.phone}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
