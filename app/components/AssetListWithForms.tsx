"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Loader2, FileText, Zap, Printer } from "lucide-react";
import { AssetForm } from "./AssetForm";
import { AssetDetail } from "./AssetDetail";
import { BulkAssetUploader } from "./BulkAssetUploader";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

// Preferred display order for the category filter - matches the printable
// schedule's grouping. Any system not in this list is appended after, and
// assets with no systemId at all fall under "Uncategorized".
const CATEGORY_ORDER = ["Doors", "Windows", "Appliances", "Plumbing"];
const UNCATEGORIZED = "Uncategorized";

interface Space {
  id: string;
  name: string;
}

interface System {
  id: string;
  name: string;
}

interface Trade {
  id: string;
  name: string;
}

import type { AssetWithRelations } from "@/lib/types";

interface Asset extends AssetWithRelations {}

const UNASSIGNED_TRADE = "Unassigned";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  ordered: "Ordered",
  "in-stock": "In Stock",
  active: "Active",
  archived: "Archived",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "tag tag-outline",
  ordered: "tag tag-accent",
  "in-stock": "tag tag-accent",
  active: "tag tag-neutral",
  archived: "tag tag-outline",
};

const filterBtnStyle = (active: boolean): React.CSSProperties | undefined =>
  active ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" } : undefined;

export function AssetListWithForms() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showBulkUploader, setShowBulkUploader] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>();
  const [detailAssetId, setDetailAssetId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [tradeFilter, setTradeFilter] = useState<string>("All");

  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsRes, spacesRes, systemsRes, tradesRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/spaces"),
        fetch("/api/systems"),
        fetch("/api/trades"),
      ]);

      const assetsData = await assetsRes.json();
      const spacesData = await spacesRes.json();
      const systemsData = await systemsRes.json();
      const tradesData = await tradesRes.json();

      if (assetsData.success) setAssets(assetsData.data);
      if (spacesData.success) setSpaces(spacesData.data);
      if (systemsData.success) setSystems(systemsData.data);
      if (tradesData.trades) setTrades(tradesData.trades);
    } catch (error) {
      toast.error("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClick = () => {
    setSelectedAsset(undefined);
    setShowForm(true);
  };

  const handleEditClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowForm(true);
  };

  const handleDeleteClick = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) {
      return;
    }

    setDeletingId(assetId);
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete asset");
      }

      toast.success("Asset deleted", "Asset has been removed successfully");
      await loadData();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to delete asset"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const categoryOptions = useMemo(() => {
    const present = new Set(assets.map((a) => a.system?.name || UNCATEGORIZED));
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    const extras = [...present]
      .filter((c) => c !== UNCATEGORIZED && !CATEGORY_ORDER.includes(c))
      .sort();
    const rest = present.has(UNCATEGORIZED) ? [UNCATEGORIZED] : [];
    return ["All", ...ordered, ...extras, ...rest];
  }, [assets]);

  const tradeOptions = useMemo(() => {
    const present = new Set(assets.map((a) => a.trade?.name || UNASSIGNED_TRADE));
    return ["All", ...[...present].sort()];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const categoryMatch =
        categoryFilter === "All" ||
        (a.system?.name || UNCATEGORIZED) === categoryFilter;
      const tradeMatch =
        tradeFilter === "All" || (a.trade?.name || UNASSIGNED_TRADE) === tradeFilter;
      return categoryMatch && tradeMatch;
    });
  }, [assets, categoryFilter, tradeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="classical">
      {/* Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 8, marginBottom: 18 }}>
        <Link
          href={
            categoryFilter === "All"
              ? "/app/assets/schedule"
              : `/app/assets/schedule?category=${encodeURIComponent(categoryFilter)}`
          }
          className="btn"
          title="Printable schedule grouped by category"
        >
          <Printer size={16} strokeWidth={1.8} />
          Print Schedule
        </Link>
        <button
          className="btn"
          onClick={() => setShowBulkUploader(true)}
          title="Upload and analyze images/PDFs with AI"
        >
          <Zap size={16} strokeWidth={1.8} />
          Add via AI
        </button>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <Plus size={16} strokeWidth={1.8} />
          Add Asset
        </button>
      </div>

      {/* Category Filter */}
      {assets.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              className="btn"
              style={filterBtnStyle(categoryFilter === cat)}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
              {cat !== "All" &&
                ` (${assets.filter((a) => (a.system?.name || UNCATEGORIZED) === cat).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Trade Filter */}
      {assets.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          {tradeOptions.map((trade) => (
            <button
              key={trade}
              className="btn"
              style={filterBtnStyle(tradeFilter === trade)}
              onClick={() => setTradeFilter(trade)}
            >
              {trade}
              {trade !== "All" &&
                ` (${assets.filter((a) => (a.trade?.name || UNASSIGNED_TRADE) === trade).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Assets Table */}
      {assets.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p className="card-meta">No assets yet. Create one to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleAddClick}>
            Create First Asset
          </button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Manufacturer / Model</th>
              <th>Size</th>
              <th>Selection</th>
              <th>Trade</th>
              <th>Location</th>
              <th>Cost</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset) => (
              <tr key={asset.id}>
                <td style={{ fontWeight: 600 }}>{asset.name}</td>
                <td>
                  {asset.system?.name || (
                    <span style={{ fontStyle: "italic", color: "var(--color-neutral-600)" }}>
                      {UNCATEGORIZED}
                    </span>
                  )}
                </td>
                <td>
                  {asset.manufacturer || "—"}
                  {asset.model ? ` / ${asset.model}` : ""}
                </td>
                <td>{asset.size || "—"}</td>
                <td>{asset.finish || "—"}</td>
                <td>
                  {asset.trade?.name || (
                    <span style={{ fontStyle: "italic", color: "var(--color-neutral-600)" }}>
                      {UNASSIGNED_TRADE}
                    </span>
                  )}
                </td>
                <td>{asset.space.name}</td>
                <td>{asset.cost ? formatCurrency(asset.cost) : "—"}</td>
                <td>
                  <span className={STATUS_CLASS[asset.status] || "tag tag-outline"}>
                    {STATUS_LABEL[asset.status] || asset.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-icon"
                      onClick={() => {
                        setDetailAssetId(asset.id);
                        setShowDetail(true);
                      }}
                      aria-label="Documents & specs"
                      title="Documents & specs"
                    >
                      <FileText size={14} strokeWidth={1.8} />
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => handleEditClick(asset)}
                      aria-label="Edit asset"
                      title="Edit"
                    >
                      <Edit2 size={14} strokeWidth={1.8} />
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => handleDeleteClick(asset.id)}
                      disabled={deletingId === asset.id}
                      aria-label="Delete asset"
                      title="Delete"
                    >
                      {deletingId === asset.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} strokeWidth={1.8} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Form Modal */}
      {showForm && (
        <AssetForm
          asset={selectedAsset}
          spaces={spaces}
          systems={systems}
          trades={trades}
          onClose={() => {
            setShowForm(false);
            setSelectedAsset(undefined);
          }}
          onSuccess={loadData}
        />
      )}

      {/* Detail Modal */}
      {showDetail && detailAssetId && (
        <AssetDetail
          assetId={detailAssetId}
          assetName={
            assets.find((a) => a.id === detailAssetId)?.name || "Asset"
          }
          onClose={() => {
            setShowDetail(false);
            setDetailAssetId(null);
          }}
        />
      )}

      {/* Bulk Uploader Modal */}
      {showBulkUploader && (
        <BulkAssetUploader
          spaceId={spaces[0]?.id || ""}
          spaces={spaces}
          onClose={() => setShowBulkUploader(false)}
          onSuccess={() => {
            setShowBulkUploader(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
