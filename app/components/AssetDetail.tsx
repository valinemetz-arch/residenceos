"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";
import { toast } from "@/lib/toast";

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

interface AssetDetailProps {
  assetId: string;
  assetName: string;
  onClose: () => void;
}

export function AssetDetail({
  assetId,
  assetName,
  onClose,
}: AssetDetailProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const docsRes = await fetch(
        `/api/assets/${assetId}/documents`
      );

      const docsData = await docsRes.json();

      if (docsData.success) setDocuments(docsData.data);
    } catch (error) {
      toast.error("Error", "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [assetId]);

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
          maxHeight: "90vh",
          overflow: "auto",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 30px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 22 }}>{assetName}</h2>
            <p className="card-meta" style={{ marginTop: 4 }}>
              Product Documentation &amp; Specifications
            </p>
          </div>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div>
            {/* Documents Section */}
            <div>
              <h3 style={{ marginBottom: 14 }}>Documentation</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <DocumentUpload
                  entityType="asset"
                  entityId={assetId}
                  onSuccess={loadFiles}
                />
                <DocumentList documents={documents} onDelete={loadFiles} />
              </div>
              <p style={{ marginTop: 12, fontSize: 12, color: "var(--color-neutral-600)" }}>
                Upload manuals, spec sheets, warranties, maintenance guides, and other product documentation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
