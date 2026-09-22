"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Paperclip, LayoutGrid, Wrench, Maximize2, X, Download } from "lucide-react";
import { toast } from "@/lib/toast";

interface NamedRef {
  id: string;
  name: string;
}

interface RefDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileName: string;
  type: string;
  description?: string | null;
}

interface RefAsset {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  finish: string | null;
  size: string | null;
  status: string;
  notes: string | null;
  space: NamedRef;
  system: NamedRef | null;
  trade: NamedRef | null;
  documents: RefDocument[];
}

interface RefPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  suggestedNote: string | null;
  document: { id: string; name: string; fileUrl: string; fileName: string };
  confirmedSpace: NamedRef | null;
  confirmedTrade: NamedRef | null;
}

interface RefTakeoffItem {
  id: string;
  description: string;
  quantity: number | null;
  unit: string | null;
}

interface RefPlanPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
}

interface RefPlanSet {
  id: string;
  name: string;
  pages: RefPlanPage[];
}

interface ReferenceExplorerProps {
  /** Trades to offer in the "By Trade" picker - a contractor's own trades, or every trade for the homeowner/GC. */
  trades: NamedRef[];
  /** Whether to show every space's trades when in space mode, vs. just the picker's owner's trade. Always true here - kept explicit for clarity at call sites. */
  showAllTradesInSpaceMode?: boolean;
}

type Mode = "trade" | "space";

// Opens a document/page's PDF in a new tab. For a page split out of a
// multi-page set, appends a #page= fragment so Chrome/most PDF viewers jump
// straight to the right sheet instead of the first page.
function openReference(fileUrl: string, pageNumber?: number) {
  const url = pageNumber ? `${fileUrl}#page=${pageNumber}` : fileUrl;
  window.open(url, "_blank", "noopener,noreferrer");
}

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Builds a supplier-ready material list from confirmed takeoff quantities
// plus the assets tagged to this trade (each asset counts as qty 1 unless a
// takeoff quantity already covers it) - e.g. a framer's lumber list to hand
// their supplier for a quote.
function downloadMaterialList(tradeName: string, assets: RefAsset[], takeoffItems: RefTakeoffItem[]) {
  const rows: string[] = ["Item,Quantity,Unit,Source"];
  for (const item of takeoffItems) {
    rows.push(
      [csvCell(item.description), csvCell(item.quantity ?? ""), csvCell(item.unit ?? ""), "Plan takeoff"].join(",")
    );
  }
  for (const asset of assets) {
    const label = [asset.name, asset.manufacturer, asset.model].filter(Boolean).join(" ");
    rows.push([csvCell(label), "1", "each", csvCell(`Asset - ${asset.space.name}`)].join(","));
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tradeName.replace(/[^a-z0-9]+/gi, "-")}-material-list.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReferenceExplorer({ trades }: ReferenceExplorerProps) {
  const [mode, setMode] = useState<Mode>("trade");
  const [spaces, setSpaces] = useState<NamedRef[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string>(trades[0]?.id || "");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<RefAsset[]>([]);
  const [documents, setDocuments] = useState<RefDocument[]>([]);
  const [pages, setPages] = useState<RefPage[]>([]);
  const [takeoffItems, setTakeoffItems] = useState<RefTakeoffItem[]>([]);
  const [planSets, setPlanSets] = useState<RefPlanSet[]>([]);
  const [zoomedPage, setZoomedPage] = useState<RefPage | null>(null);
  const [zoomedPlanPage, setZoomedPlanPage] = useState<RefPlanPage | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/spaces");
        const json = await res.json();
        if (json.success) {
          const list: NamedRef[] = json.data.map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          }));
          setSpaces(list);
          setSelectedSpaceId((prev) => prev || list[0]?.id || "");
        }
      } catch {
        // spaces picker just stays empty; trade mode still works
      }
    })();
  }, []);

  const selectedId = mode === "trade" ? selectedTradeId : selectedSpaceId;

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      setLoading(true);
      try {
        const param = mode === "trade" ? `tradeId=${selectedTradeId}` : `spaceId=${selectedSpaceId}`;
        const res = await fetch(`/api/reference?mode=${mode}&${param}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load reference");
        setAssets(json.data.assets || []);
        setDocuments(json.data.documents || []);
        setPages(json.data.pages || []);
        setTakeoffItems(json.data.takeoffItems || []);
        setPlanSets(json.data.planSets || []);
      } catch (error) {
        toast.error("Error", "Failed to load field reference");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, selectedId, selectedTradeId, selectedSpaceId]);

  const groupedBySpace = useMemo(() => {
    if (mode !== "space") return null;
    // In space mode, group asset rows by trade so "see both the plumber and
    // the electrician" reads as clearly separated sections.
    const groups = new Map<string, RefAsset[]>();
    for (const asset of assets) {
      const key = asset.trade?.name || "Untagged";
      groups.set(key, [...(groups.get(key) || []), asset]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [assets, mode]);

  const referenceCount = documents.length + pages.length;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button
            onClick={() => setMode("trade")}
            className="btn"
            style={
              mode === "trade"
                ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" }
                : undefined
            }
          >
            <Wrench size={14} strokeWidth={1.8} style={{ marginRight: 6 }} />
            By Trade
          </button>
          <button
            onClick={() => setMode("space")}
            className="btn"
            style={
              mode === "space"
                ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" }
                : undefined
            }
          >
            <LayoutGrid size={14} strokeWidth={1.8} style={{ marginRight: 6 }} />
            By Space
          </button>
        </div>

        {mode === "trade" ? (
          trades.length === 0 ? (
            <p className="card-meta">No trades available.</p>
          ) : (
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
          )
        ) : (
          <select
            value={selectedSpaceId}
            onChange={(e) => setSelectedSpaceId(e.target.value)}
            className="btn"
            style={{ minWidth: 220 }}
          >
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : !selectedId ? (
        <p className="card-meta">Pick a {mode} to see its reference.</p>
      ) : (
        <>
          {mode === "trade" && (assets.length > 0 || takeoffItems.length > 0) && (
            <button
              onClick={() =>
                downloadMaterialList(
                  trades.find((t) => t.id === selectedTradeId)?.name || "trade",
                  assets,
                  takeoffItems
                )
              }
              className="btn btn-secondary"
              style={{ marginBottom: 20 }}
            >
              <Download size={14} strokeWidth={1.8} style={{ marginRight: 6 }} />
              Download Material List (CSV)
            </button>
          )}

          {planSets.length > 0 && planSets.some((ps) => ps.pages.length > 0) && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 14 }}>Floor Plan</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {planSets.map((planSet) =>
                  planSet.pages.length === 0 ? null : (
                    <div key={planSet.id}>
                      <p className="card-kicker" style={{ marginBottom: 8 }}>
                        {planSet.name}
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                          gap: 14,
                        }}
                      >
                        {planSet.pages.map((page) => (
                          <button
                            key={page.id}
                            onClick={() => setZoomedPlanPage(page)}
                            className="group relative overflow-hidden"
                            style={{
                              border: "1px solid var(--color-divider)",
                              borderRadius: "var(--radius-md)",
                              padding: 0,
                              background: "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full bg-white object-contain" />
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
            </div>
          )}

          {mode === "trade" && takeoffItems.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 14 }}>Takeoffs</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {takeoffItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.description}</td>
                        <td>{item.quantity != null ? `${item.quantity} ${item.unit || ""}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 14 }}>Installed / Specified Assets</h3>
            {assets.length === 0 ? (
              <p className="card-meta">Nothing tagged here yet.</p>
            ) : mode === "space" && groupedBySpace ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {groupedBySpace.map(([tradeName, tradeAssets]) => (
                  <div key={tradeName}>
                    <p className="card-kicker" style={{ marginBottom: 8 }}>
                      {tradeName}
                    </p>
                    <AssetTable assets={tradeAssets} showSpace={false} />
                  </div>
                ))}
              </div>
            ) : (
              <AssetTable assets={assets} showSpace />
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Specs &amp; Elevation Sheets</h3>
            {referenceCount === 0 ? (
              <p className="card-meta">No spec sheets or elevations tagged here yet.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 14,
                }}
              >
                {pages.map((page) => (
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
                      textAlign: "left",
                    }}
                  >
                    <img
                      src={page.imageUrl}
                      alt={page.suggestedNote || `${page.document.name} - page ${page.pageNumber}`}
                      className="w-full bg-white object-contain"
                    />
                    <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                      <Maximize2 className="h-6 w-6 text-white" />
                    </div>
                    <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-left text-xs text-white">
                      {page.suggestedNote || `${page.document.name} - p.${page.pageNumber}`}
                    </p>
                  </button>
                ))}
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => openReference(doc.fileUrl)}
                    className="card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 6,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Paperclip size={16} strokeWidth={1.8} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</span>
                    <span className="card-meta">{doc.description || doc.fileName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
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
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, maxHeight: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedPage.imageUrl}
              alt={zoomedPage.suggestedNote || `Page ${zoomedPage.pageNumber}`}
              className="max-h-full max-w-full object-contain"
            />
            <button
              onClick={() => openReference(zoomedPage.document.fileUrl, zoomedPage.pageNumber)}
              className="btn btn-secondary"
            >
              Open Full PDF at This Page
            </button>
          </div>
        </div>
      )}

      {zoomedPlanPage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomedPlanPage(null)}
        >
          <button
            onClick={() => setZoomedPlanPage(null)}
            className="btn btn-icon"
            style={{ position: "absolute", top: 16, right: 16, color: "white" }}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={zoomedPlanPage.imageUrl}
            alt={`Page ${zoomedPlanPage.pageNumber}`}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function AssetTable({ assets, showSpace }: { assets: RefAsset[]; showSpace: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            {showSpace && <th>Space</th>}
            <th>Item</th>
            <th>Manufacturer / Model</th>
            <th>Selection</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Docs</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              {showSpace && <td>{asset.space.name}</td>}
              <td style={{ fontWeight: 600 }}>{asset.name}</td>
              <td>{[asset.manufacturer, asset.model].filter(Boolean).join(" / ") || "—"}</td>
              <td>{[asset.finish, asset.size].filter(Boolean).join(", ") || "—"}</td>
              <td>{asset.status}</td>
              <td style={{ maxWidth: "20rem" }}>{asset.notes || "—"}</td>
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
  );
}
