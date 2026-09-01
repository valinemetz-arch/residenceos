"use client";

import { useState } from "react";
import { X, Upload, FileText, Image, Loader2, Edit2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { SpaceCreationTab } from "./tabs/SpaceCreationTab";
import { ScheduleExtractionTab } from "./tabs/ScheduleExtractionTab";
import { GapAnalysisTab } from "./tabs/GapAnalysisTab";
import { BidExtractionTab } from "./tabs/BidExtractionTab";

type Tab = "assets" | "spaces" | "schedules" | "gap-analysis" | "bids";

interface ExtractedAsset {
  name: string;
  description: string | null;
  unitPrice: number | null;
  quantity: number | null;
  category: string | null;
  vendor: string | null;
  sku: string | null;
  manufacturer?: string | null;
  model?: string | null;
}

interface FilePreview {
  file: File;
  preview: string;
  type: string;
}

interface BulkAssetUploaderProps {
  spaceId: string;
  spaces: Array<{ id: string; name: string }>;
  projectId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  background: "transparent",
  border: "none",
  borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
  color: active ? "var(--color-accent-700)" : "var(--color-neutral-700)",
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
});

export function BulkAssetUploader({
  spaceId,
  spaces,
  projectId,
  onClose,
  onSuccess,
}: BulkAssetUploaderProps) {
  const [activeTab, setActiveTab] = useState<Tab>("assets");
  const currentTab = (activeTab as string) as Tab;
  // tabKey is used in JSX comparisons to avoid TypeScript narrowing from early returns
  const tabKey: string = activeTab;
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [extractedAssets, setExtractedAssets] = useState<ExtractedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceId);
  const [editingAssetIndex, setEditingAssetIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = "var(--color-accent)";
    e.currentTarget.style.background = "var(--color-accent-100)";
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = "var(--color-divider)";
    e.currentTarget.style.background = "var(--color-surface)";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = "var(--color-divider)";
    e.currentTarget.style.background = "var(--color-surface)";
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    Array.from(fileList).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Invalid file type",
          `${file.name} is not a supported format. Please use images (JPG, PNG, WebP) or PDFs.`
        );
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          "File too large",
          `${file.name} exceeds 10MB limit.`
        );
        return;
      }

      const preview =
        file.type.startsWith("image/") ? URL.createObjectURL(file) : "";

      setFiles((prev) => [
        ...prev,
        {
          file,
          preview,
          type: file.type,
        },
      ]);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const analyzeFiles = async () => {
    if (files.length === 0) {
      toast.error("No files", "Please upload files first");
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f.file);
      });

      const response = await fetch("/api/assets/bulk-import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to analyze files");
      }

      setExtractedAssets(result.data || []);
      if (result.data && result.data.length > 0) {
        toast.success(
          "Analysis complete",
          `Extracted data from ${result.data.length} file(s)`
        );
      }
    } catch (error) {
      toast.error(
        "Analysis failed",
        error instanceof Error ? error.message : "Failed to analyze files"
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const createAssets = async () => {
    if (extractedAssets.length === 0) {
      toast.error("No assets", "Please analyze files first");
      return;
    }

    setLoading(true);
    try {
      const assetsToCreate = extractedAssets.map((asset) => ({
        name: asset.name,
        manufacturer: asset.manufacturer || null,
        model: asset.model || null,
        sku: asset.sku || null,
        vendor: asset.vendor || null,
        cost: asset.unitPrice,
        status: "pending",
        notes: asset.description || null,
        spaceId: selectedSpaceId,
        systemId: null,
      }));

      const response = await fetch("/api/assets/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: assetsToCreate }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create assets");
      }

      toast.success(
        "Assets created",
        `Successfully created ${result.data.length} asset(s)`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Creation failed",
        error instanceof Error ? error.message : "Failed to create assets"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAssetField = (
    index: number,
    field: keyof ExtractedAsset,
    value: unknown
  ) => {
    setExtractedAssets((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Handle tab switching
  const handleTabChange = (tab: string) => setActiveTab(tab as Tab);
  if (currentTab !== "assets") {
    if (tabKey === "spaces") {
      return <SpaceCreationTab onClose={onClose} onSuccess={onSuccess} onTabChange={handleTabChange} />;
    }
    if (tabKey === "schedules") {
      return <ScheduleExtractionTab spaceId={spaceId} spaces={spaces} onClose={onClose} onSuccess={onSuccess} onTabChange={handleTabChange} />;
    }
    if (tabKey === "gap-analysis") {
      return <GapAnalysisTab projectId={projectId || spaceId} onClose={onClose} onTabChange={handleTabChange} />;
    }
    if (tabKey === "bids") {
      return <BidExtractionTab spaceId={spaceId} spaces={spaces} onClose={onClose} onSuccess={onSuccess} onTabChange={handleTabChange} />;
    }
  }

  // File upload stage - Assets tab
  if (extractedAssets.length === 0) {
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
            width: 672,
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
            <h2 style={{ fontSize: 22 }}>Add Assets via AI</h2>
            <button className="btn btn-icon" onClick={onClose} aria-label="Close">
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-divider)", marginBottom: 18 }}>
            <button style={tabButtonStyle(tabKey === "assets")} onClick={() => setActiveTab("assets")}>
              Add Assets
            </button>
            <button style={tabButtonStyle(tabKey === "spaces")} onClick={() => setActiveTab("spaces")}>
              Create Spaces
            </button>
            <button style={tabButtonStyle(tabKey === "schedules")} onClick={() => setActiveTab("schedules")}>
              Extract Schedules
            </button>
            <button style={tabButtonStyle(tabKey === "gap-analysis")} onClick={() => setActiveTab("gap-analysis")}>
              Gap Analysis
            </button>
            <button style={tabButtonStyle(tabKey === "bids")} onClick={() => setActiveTab("bids")}>
              Extract Bids
            </button>
          </div>

          {/* Space Selector */}
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-neutral-700)",
                marginBottom: 6,
              }}
            >
              Default Space for Assets
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              style={{ width: "100%" }}
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              marginBottom: 18,
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--color-divider)",
              background: "var(--color-surface)",
              padding: 32,
              textAlign: "center",
              transition: "border-color 150ms ease, background 150ms ease",
            }}
          >
            <Upload size={40} strokeWidth={1.5} style={{ margin: "0 auto", color: "var(--color-neutral-500)" }} />
            <p style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>
              Drag and drop files here
            </p>
            <p style={{ marginTop: 4, fontSize: 13, color: "var(--color-neutral-600)" }}>
              or
            </p>
            <label style={{ marginTop: 8, display: "inline-block" }}>
              <span style={{ cursor: "pointer", color: "var(--color-accent-700)" }}>
                click to select files
              </span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
            <p style={{ marginTop: 8, fontSize: 12, color: "var(--color-neutral-600)" }}>
              JPG, PNG, WebP, or PDF up to 10MB
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ marginBottom: 10 }}>
                Selected Files ({files.length})
              </h4>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid var(--color-divider)",
                      background: "var(--color-surface)",
                      borderRadius: "var(--radius-md)",
                      padding: 10,
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {f.preview ? (
                        <img
                          src={f.preview}
                          alt={f.file.name}
                          style={{ height: 40, width: 40, borderRadius: "var(--radius-sm)", objectFit: "cover" }}
                        />
                      ) : (
                        <FileText size={36} strokeWidth={1.5} style={{ color: "var(--color-accent-700)" }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {f.file.name}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>
                        {(f.file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button className="btn btn-icon" onClick={() => removeFile(idx)} aria-label="Remove file">
                      <X size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={analyzeFiles}
              disabled={analyzing || files.length === 0}
            >
              {analyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload size={16} strokeWidth={1.8} />
                  Analyze Files
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review and Edit stage
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
          width: 880,
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
          <h2 style={{ fontSize: 22 }}>
            Review Extracted Assets ({extractedAssets.length})
          </h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Asset List for Editing */}
        <div style={{ marginBottom: 18, display: "flex", flexDirection: "column", gap: 10, maxHeight: "50vh", overflowY: "auto" }}>
          {extractedAssets.map((asset, idx) => (
            <div key={idx} className="card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <p className="card-title">
                    {asset.name || "(No name)"}
                  </p>
                  {asset.description && (
                    <p style={{ fontSize: 13, color: "var(--color-neutral-600)", marginTop: 2 }}>
                      {asset.description}
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-icon"
                  onClick={() =>
                    setEditingAssetIndex(
                      editingAssetIndex === idx ? null : idx
                    )
                  }
                  aria-label="Edit extracted asset"
                >
                  <Edit2 size={14} strokeWidth={1.8} />
                </button>
              </div>

              {editingAssetIndex === idx && (
                <div style={{ display: "grid", gap: 8, paddingTop: 10 }}>
                  <input
                    type="text"
                    value={asset.name}
                    onChange={(e) =>
                      updateAssetField(idx, "name", e.target.value)
                    }
                    placeholder="Asset name"
                    style={{ fontSize: 13 }}
                  />
                  <input
                    type="text"
                    value={asset.manufacturer || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "manufacturer", e.target.value)
                    }
                    placeholder="Manufacturer"
                    style={{ fontSize: 13 }}
                  />
                  <input
                    type="text"
                    value={asset.model || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "model", e.target.value)
                    }
                    placeholder="Model"
                    style={{ fontSize: 13 }}
                  />
                  <input
                    type="text"
                    value={asset.sku || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "sku", e.target.value)
                    }
                    placeholder="SKU"
                    style={{ fontSize: 13 }}
                  />
                  <input
                    type="text"
                    value={asset.vendor || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "vendor", e.target.value)
                    }
                    placeholder="Vendor"
                    style={{ fontSize: 13 }}
                  />
                  <input
                    type="number"
                    value={asset.unitPrice ?? ""}
                    onChange={(e) =>
                      updateAssetField(
                        idx,
                        "unitPrice",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="Price"
                    step="0.01"
                    style={{ fontSize: 13 }}
                  />
                  <textarea
                    value={asset.description || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "description", e.target.value)
                    }
                    placeholder="Description"
                    rows={2}
                    style={{ fontSize: 13 }}
                  />
                </div>
              )}

              {editingAssetIndex !== idx && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                  {asset.sku && (
                    <div>
                      <span style={{ color: "var(--color-neutral-600)" }}>SKU: </span>
                      <span>{asset.sku}</span>
                    </div>
                  )}
                  {asset.vendor && (
                    <div>
                      <span style={{ color: "var(--color-neutral-600)" }}>Vendor: </span>
                      <span>{asset.vendor}</span>
                    </div>
                  )}
                  {asset.unitPrice && (
                    <div>
                      <span style={{ color: "var(--color-neutral-600)" }}>Price: </span>
                      <span>${asset.unitPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {asset.quantity && (
                    <div>
                      <span style={{ color: "var(--color-neutral-600)" }}>Qty: </span>
                      <span>{asset.quantity}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn"
            style={{ flex: 1 }}
            onClick={() => {
              setExtractedAssets([]);
              setFiles([]);
            }}
          >
            Back to Upload
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={createAssets} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>Create All Assets</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
