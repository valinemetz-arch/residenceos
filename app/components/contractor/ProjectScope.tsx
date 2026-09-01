"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Layers, Paperclip, Maximize2, X } from "lucide-react";
import { toast } from "@/lib/toast";

interface Trade {
  id: string;
  name: string;
}

interface ScopeDocument {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileType: string | null;
}

interface ScopeAsset {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  finish: string | null;
  size: string | null;
  status: string;
  notes: string | null;
  space: { id: string; name: string };
  system: { id: string; name: string } | null;
  trade: { id: string; name: string } | null;
  documents: ScopeDocument[];
}

interface ScopeTakeoffItem {
  id: string;
  description: string;
  quantity: number | null;
  unit: string | null;
  trade: { id: string; name: string } | null;
}

interface PlanPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
}

interface PlanSet {
  id: string;
  name: string;
  pages: PlanPage[];
}

interface ProjectScopeProps {
  projectId: string;
}

type Tab = "assets" | "takeoff" | "selections" | "floorplan";

export default function ProjectScope({ projectId }: ProjectScopeProps) {
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [assets, setAssets] = useState<ScopeAsset[]>([]);
  const [planItems, setPlanItems] = useState<ScopeTakeoffItem[]>([]);
  const [planSets, setPlanSets] = useState<PlanSet[]>([]);
  const [activeTradeId, setActiveTradeId] = useState<string>("all");
  const [tab, setTab] = useState<Tab>("assets");
  const [zoomedPage, setZoomedPage] = useState<PlanPage | null>(null);

  useEffect(() => {
    loadScope();
  }, [projectId]);

  const loadScope = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contractor/projects/${projectId}/scope`);
      if (!res.ok) throw new Error("Failed to load project scope");
      const result = await res.json();
      setTrades(result.data.trades || []);
      setAssets(result.data.assets || []);
      setPlanItems(result.data.takeoffItems || []);
      setPlanSets(result.data.planSets || []);
    } catch (error) {
      toast.error("Error", "Failed to load project scope");
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = useMemo(() => {
    if (activeTradeId === "all") return assets;
    return assets.filter((a) => a.trade?.id === activeTradeId);
  }, [assets, activeTradeId]);

  const filteredPlanItems = useMemo(() => {
    if (activeTradeId === "all") return planItems;
    return planItems.filter((i) => i.trade?.id === activeTradeId);
  }, [planItems, activeTradeId]);

  const takeoffGroups = useMemo(() => {
    const groups = new Map<string, { name: string; space: string; count: number }>();
    for (const asset of filteredAssets) {
      const key = `${asset.name}::${asset.space.name}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, { name: asset.name, space: asset.space.name, count: 1 });
      }
    }
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredAssets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{ marginBottom: 26 }}>
      <h3 style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <Layers size={18} strokeWidth={1.8} />
        Scope of Work for Your Trade{trades.length > 1 ? "s" : ""}
      </h3>

      {/* Trade filter */}
      {trades.length > 1 && (
        <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button
            onClick={() => setActiveTradeId("all")}
            className="btn"
            style={
              activeTradeId === "all"
                ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" }
                : undefined
            }
          >
            All My Trades
          </button>
          {trades.map((trade) => (
            <button
              key={trade.id}
              onClick={() => setActiveTradeId(trade.id)}
              className="btn"
              style={
                activeTradeId === trade.id
                  ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" }
                  : undefined
              }
            >
              {trade.name}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {(["assets", "takeoff", "selections", "floorplan"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn"
            style={
              tab === t
                ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)", textTransform: "capitalize" }
                : { textTransform: "capitalize" }
            }
          >
            {t === "floorplan" ? "Floor Plan" : t}
          </button>
        ))}
      </div>

      {tab === "floorplan" ? (
        planSets.length === 0 || planSets.every((ps) => ps.pages.length === 0) ? (
          <p className="card-meta">No floor plan has been uploaded for this project yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {planSets.map((planSet) =>
              planSet.pages.length === 0 ? null : (
                <div key={planSet.id}>
                  <p className="card-kicker" style={{ marginBottom: 8 }}>
                    {planSet.name}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {planSet.pages.map((page) => (
                      <button
                        key={page.id}
                        onClick={() => setZoomedPage(page)}
                        className="group relative overflow-hidden"
                        style={{
                          border: "1px solid var(--color-divider)",
                          borderRadius: "var(--radius-md)",
                          padding: 0,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={page.imageUrl}
                          alt={`${planSet.name} - page ${page.pageNumber}`}
                          className="w-full bg-white object-contain"
                        />
                        <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                          <Maximize2 className="h-6 w-6 text-white" />
                        </div>
                        <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-left text-xs text-white">
                          Page {page.pageNumber}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )
      ) : filteredAssets.length === 0 && filteredPlanItems.length === 0 ? (
        <p className="card-meta">
          No scope items have been tagged to your trade(s) for this project yet.
        </p>
      ) : tab === "assets" ? (
        filteredAssets.length === 0 ? (
          <p className="card-meta">No installed-product assets tagged to your trade(s) yet.</p>
        ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Space</th>
                <th>Item</th>
                <th>Manufacturer / Model</th>
                <th>Selection</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Docs</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.space.name}</td>
                  <td style={{ fontWeight: 600 }}>{asset.name}</td>
                  <td>
                    {[asset.manufacturer, asset.model].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td>
                    {[asset.finish, asset.size].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td>{asset.status}</td>
                  <td style={{ maxWidth: "20rem" }}>
                    {asset.notes || "—"}
                  </td>
                  <td>
                    {asset.documents.length === 0 ? (
                      "—"
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {asset.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <Paperclip className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[10rem]">{doc.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )
      ) : tab === "takeoff" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {takeoffGroups.length > 0 && (
            <div className="overflow-x-auto">
              <p className="card-kicker" style={{ marginBottom: 8 }}>
                From installed-product assets
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Space</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {takeoffGroups.map((group) => (
                    <tr key={`${group.name}::${group.space}`}>
                      <td style={{ fontWeight: 600 }}>{group.name}</td>
                      <td>{group.space}</td>
                      <td>{group.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredPlanItems.length > 0 && (
            <div className="overflow-x-auto">
              <p className="card-kicker" style={{ marginBottom: 8 }}>
                From floor plan takeoff
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlanItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td>
                        {item.quantity != null ? `${item.quantity} ${item.unit || ""}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {takeoffGroups.length === 0 && filteredPlanItems.length === 0 && (
            <p className="card-meta">No takeoff quantities available for your trade(s) yet.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Space</th>
                <th>Finish</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 600 }}>{asset.name}</td>
                  <td>{asset.space.name}</td>
                  <td>{asset.finish || "—"}</td>
                  <td>{asset.size || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {zoomedPage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomedPage(null)}
        >
          <button
            onClick={() => setZoomedPage(null)}
            className="btn btn-icon"
            style={{ position: "absolute", top: 16, right: 16, color: "white" }}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={zoomedPage.imageUrl}
            alt={`Page ${zoomedPage.pageNumber}`}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
