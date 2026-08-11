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

export function BulkAssetUploader({
  spaceId,
  spaces,
  projectId,
  onClose,
  onSuccess,
}: BulkAssetUploaderProps) {
  const [activeTab, setActiveTab] = useState<Tab>("assets");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [extractedAssets, setExtractedAssets] = useState<ExtractedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceId);
  const [editingAssetIndex, setEditingAssetIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
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
  if (activeTab === "spaces") {
    return (
      <SpaceCreationTab
        onClose={onClose}
        onSuccess={onSuccess}
        onTabChange={setActiveTab}
      />
    );
  }

  if (activeTab === "schedules") {
    return (
      <ScheduleExtractionTab
        spaceId={spaceId}
        spaces={spaces}
        onClose={onClose}
        onSuccess={onSuccess}
        onTabChange={setActiveTab}
      />
    );
  }

  if (activeTab === "gap-analysis") {
    return (
      <GapAnalysisTab
        projectId={projectId || spaceId}
        onClose={onClose}
        onTabChange={setActiveTab}
      />
    );
  }

  if (activeTab === "bids") {
    return (
      <BidExtractionTab
        spaceId={spaceId}
        spaces={spaces}
        onClose={onClose}
        onSuccess={onSuccess}
        onTabChange={setActiveTab}
      />
    );
  }

  // File upload stage - Assets tab
  if (extractedAssets.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-white">
              Add Assets via AI
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("assets")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "assets"
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Add Assets
            </button>
            <button
              onClick={() => setActiveTab("spaces")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "spaces"
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Create Spaces
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "schedules"
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Extract Schedules
            </button>
            <button
              onClick={() => setActiveTab("gap-analysis")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "gap-analysis"
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Gap Analysis
            </button>
            <button
              onClick={() => setActiveTab("bids")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "bids"
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Extract Bids
            </button>
          </div>

          {/* Space Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium dark:text-gray-200">
              Default Space for Assets
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
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
            className="mb-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors dark:border-gray-600 dark:bg-slate-800"
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Drag and drop files here
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              or
            </p>
            <label className="mt-2 inline-block">
              <span className="cursor-pointer text-blue-500 hover:text-blue-600">
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
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG, WebP, or PDF up to 10MB
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold dark:text-gray-200">
                Selected Files ({files.length})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-slate-800"
                  >
                    <div className="flex-shrink-0">
                      {f.preview ? (
                        <img
                          src={f.preview}
                          alt={f.file.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <FileText className="h-10 w-10 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium dark:text-gray-200">
                        {f.file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(f.file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded border border-gray-300 px-4 py-2 font-medium dark:border-gray-600 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={analyzeFiles}
              disabled={analyzing || files.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">
            Review Extracted Assets ({extractedAssets.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Asset List for Editing */}
        <div className="mb-6 space-y-3 max-h-[50vh] overflow-y-auto">
          {extractedAssets.map((asset, idx) => (
            <div
              key={idx}
              className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-800"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-semibold dark:text-white">
                    {asset.name || "(No name)"}
                  </p>
                  {asset.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {asset.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    setEditingAssetIndex(
                      editingAssetIndex === idx ? null : idx
                    )
                  }
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {editingAssetIndex === idx && (
                <div className="grid gap-2 pt-3">
                  <input
                    type="text"
                    value={asset.name}
                    onChange={(e) =>
                      updateAssetField(idx, "name", e.target.value)
                    }
                    placeholder="Asset name"
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={asset.manufacturer || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "manufacturer", e.target.value)
                    }
                    placeholder="Manufacturer"
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={asset.model || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "model", e.target.value)
                    }
                    placeholder="Model"
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={asset.sku || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "sku", e.target.value)
                    }
                    placeholder="SKU"
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={asset.vendor || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "vendor", e.target.value)
                    }
                    placeholder="Vendor"
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
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
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                  <textarea
                    value={asset.description || ""}
                    onChange={(e) =>
                      updateAssetField(idx, "description", e.target.value)
                    }
                    placeholder="Description"
                    rows={2}
                    className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              )}

              {editingAssetIndex !== idx && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {asset.sku && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        SKU:{" "}
                      </span>
                      <span className="dark:text-gray-200">{asset.sku}</span>
                    </div>
                  )}
                  {asset.vendor && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Vendor:{" "}
                      </span>
                      <span className="dark:text-gray-200">{asset.vendor}</span>
                    </div>
                  )}
                  {asset.unitPrice && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Price:{" "}
                      </span>
                      <span className="dark:text-gray-200">
                        ${asset.unitPrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {asset.quantity && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">
                        Qty:{" "}
                      </span>
                      <span className="dark:text-gray-200">{asset.quantity}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setExtractedAssets([]);
              setFiles([]);
            }}
            className="flex-1 rounded border border-gray-300 px-4 py-2 font-medium dark:border-gray-600 dark:text-gray-200"
          >
            Back to Upload
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded border border-gray-300 px-4 py-2 font-medium dark:border-gray-600 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={createAssets}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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
