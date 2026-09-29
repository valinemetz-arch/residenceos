"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Loader2 } from "lucide-react";
import { PhotoUpload } from "./PhotoUpload";
import { PhotoGallery } from "./PhotoGallery";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

const UNCATEGORIZED = "Uncategorized";
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

interface Asset {
  id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  size: string | null;
  finish: string | null;
  cost: number | null;
  status: string;
  system: { id: string; name: string } | null;
  trade: { id: string; name: string } | null;
}

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  type: string;
  description: string | null;
  createdAt: string;
}

interface SpaceDetailProps {
  spaceId: string;
  spaceName: string;
  onClose: () => void;
}

export function SpaceDetail({
  spaceId,
  spaceName,
  onClose,
}: SpaceDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const [photosRes, docsRes, spaceRes] = await Promise.all([
        fetch(`/api/spaces/${spaceId}/photos`),
        fetch(`/api/spaces/${spaceId}/documents`),
        fetch(`/api/spaces/${spaceId}`),
      ]);

      const photosData = await photosRes.json();
      const docsData = await docsRes.json();
      const spaceData = await spaceRes.json();

      if (photosData.success) setPhotos(photosData.data);
      if (docsData.success) setDocuments(docsData.data);
      if (spaceData.success) setAssets(spaceData.data.assets || []);
    } catch (error) {
      toast.error("Error", "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [spaceId]);

  return (
    <div
      className="classical"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32,31,29,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-bg)",
          width: 640,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "85vh",
          overflow: "auto",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 30px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <h2 style={{ fontSize: 22 }}>{spaceName}</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Assets Section */}
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>Assets</h3>
                <Link href="/app/assets" className="card-meta" style={{ textDecoration: "underline" }}>
                  View all assets
                </Link>
              </div>
              {assets.length === 0 ? (
                <p className="card-meta">No assets assigned to this space yet.</p>
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
                      <th>Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
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
                        <td>{asset.cost ? formatCurrency(asset.cost) : "—"}</td>
                        <td>
                          <span className={STATUS_CLASS[asset.status] || "tag tag-outline"}>
                            {STATUS_LABEL[asset.status] || asset.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="hr" />

            {/* Photos Section */}
            <div>
              <h3 style={{ marginBottom: 14 }}>Photos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <PhotoUpload
                  entityType="space"
                  entityId={spaceId}
                  onSuccess={loadFiles}
                />
                <PhotoGallery photos={photos} onDelete={loadFiles} />
              </div>
            </div>

            <div className="hr" />

            {/* Documents Section */}
            <div>
              <h3 style={{ marginBottom: 14 }}>Documents</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <DocumentUpload
                  entityType="space"
                  entityId={spaceId}
                  onSuccess={loadFiles}
                />
                <DocumentList documents={documents} onDelete={loadFiles} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
