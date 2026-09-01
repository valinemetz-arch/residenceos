"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { PhotoUpload } from "./PhotoUpload";
import { PhotoGallery } from "./PhotoGallery";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";
import { toast } from "@/lib/toast";

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

interface BudgetDetailProps {
  budgetItemId: string;
  budgetName: string;
  onClose: () => void;
  onAmountParsed?: (amount: number) => void;
}

export function BudgetDetail({
  budgetItemId,
  budgetName,
  onClose,
  onAmountParsed,
}: BudgetDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const [photosRes, docsRes] = await Promise.all([
        fetch(`/api/budget-items/${budgetItemId}/photos`),
        fetch(`/api/budget-items/${budgetItemId}/documents`),
      ]);

      const photosData = await photosRes.json();
      const docsData = await docsRes.json();

      if (photosData.success) setPhotos(photosData.data);
      if (docsData.success) setDocuments(docsData.data);
    } catch (error) {
      toast.error("Error", "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [budgetItemId]);

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22 }}>{budgetName}</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* Photos Section */}
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Photos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <PhotoUpload
                  entityType="budgetItem"
                  entityId={budgetItemId}
                  onSuccess={loadFiles}
                />
                <PhotoGallery photos={photos} onDelete={loadFiles} />
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Documents</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <DocumentUpload
                  entityType="budgetItem"
                  entityId={budgetItemId}
                  onSuccess={loadFiles}
                />
                <DocumentList
                  documents={documents}
                  onDelete={loadFiles}
                  onAmountParsed={onAmountParsed}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
