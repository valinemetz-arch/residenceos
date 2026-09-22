"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Eye, Search } from "lucide-react";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { toast } from "@/lib/toast";

interface NamedRef {
  id: string;
  name: string;
}

interface AccessRow {
  id: string;
  label: string;
  isPrimary: boolean;
  granted: boolean;
}

type ResourceType = "asset" | "document" | "documentPage";

const SECTIONS: { type: ResourceType; key: "assets" | "documents" | "pages"; title: string }[] = [
  { type: "asset", key: "assets", title: "Assets" },
  { type: "document", key: "documents", title: "Documents" },
  { type: "documentPage", key: "pages", title: "Spec & Elevation Pages" },
];

// Admin control panel for "which assets/resources should be available per
// trade" - pick a trade, then check off anything extra it should see beyond
// what's already tagged to it (Asset.tradeId, Document.tradeId/contractorId/
// visibleToAll, confirmed spec-page tags). Primary tags are set on the
// resource itself (asset/document edit form, or the spec-page review
// screen) and just show as locked-checked here.
export default function TradeAccessPage() {
  const [trades, setTrades] = useState<NamedRef[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, AccessRow[]>>({ assets: [], documents: [], pages: [] });
  const [filter, setFilter] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/trades");
      const data = await res.json();
      const list: NamedRef[] = data.trades || [];
      setTrades(list);
      setSelectedTradeId((prev) => prev || list[0]?.id || "");
    })();
  }, []);

  useEffect(() => {
    if (!selectedTradeId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/trade-access?tradeId=${selectedTradeId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load access");
        setRows(json.data);
      } catch {
        toast.error("Error", "Failed to load trade access");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedTradeId]);

  const toggle = async (type: ResourceType, key: "assets" | "documents" | "pages", row: AccessRow) => {
    if (row.isPrimary) return; // locked - change the primary tag at the source instead
    setSavingId(row.id);
    const nextGranted = !row.granted;
    try {
      const res = await fetch("/api/trade-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: selectedTradeId, resourceType: type, resourceId: row.id, granted: nextGranted }),
      });
      if (!res.ok) throw new Error("Failed to update access");
      setRows((prev) => ({
        ...prev,
        [key]: prev[key].map((r) => (r.id === row.id ? { ...r, granted: nextGranted } : r)),
      }));
    } catch {
      toast.error("Error", "Failed to update access");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    const match = (list: AccessRow[]) => list.filter((r) => r.label.toLowerCase().includes(q));
    return { assets: match(rows.assets || []), documents: match(rows.documents || []), pages: match(rows.pages || []) };
  }, [rows, filter]);

  const selectedTrade = trades.find((t) => t.id === selectedTradeId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <PortalHeader projectName="Nemetz Residence" pageTitle="Trade Access" />
        {selectedTradeId && (
          <Link href={`/app/view-as/${selectedTradeId}`} className="btn btn-secondary" style={{ flexShrink: 0, marginTop: 4 }}>
            <Eye size={14} strokeWidth={1.8} style={{ marginRight: 6 }} />
            Preview as {selectedTrade?.name || "this trade"}
          </Link>
        )}
      </div>

      <p className="card-meta" style={{ marginBottom: 18, maxWidth: 640 }}>
        Every checked item is visible to this trade on their Field Reference page. Items already tagged to this trade
        elsewhere (an asset's trade field, a document's trade/contractor, or a confirmed spec page) show locked -
        change those at the source. Use the checkboxes to grant extra access beyond that.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {trades.map((trade) => (
            <button
              key={trade.id}
              onClick={() => setSelectedTradeId(trade.id)}
              className="btn"
              style={
                selectedTradeId === trade.id
                  ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" }
                  : undefined
              }
            >
              {trade.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, maxWidth: 320 }}>
            <Search size={14} strokeWidth={1.8} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name..."
              className="btn"
              style={{ width: "100%" }}
            />
          </div>

          {SECTIONS.map(({ type, key, title }) => (
            <div key={key} className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 14 }}>{title}</h3>
              {filtered[key].length === 0 ? (
                <p className="card-meta">Nothing to show.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 340, overflowY: "auto" }}>
                  {filtered[key].map((row) => (
                    <label
                      key={row.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 4px",
                        fontSize: 13,
                        cursor: row.isPrimary ? "default" : "pointer",
                        opacity: savingId === row.id ? 0.5 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={row.granted}
                        disabled={row.isPrimary || savingId === row.id}
                        onChange={() => toggle(type, key, row)}
                      />
                      <span style={{ flex: 1 }}>{row.label}</span>
                      {row.isPrimary && <span className="tag tag-outline">primary</span>}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
