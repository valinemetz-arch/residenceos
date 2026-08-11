"use client";

import { useState } from "react";
import { X, Upload, FileText, Image, Loader2, Edit2, Trash2, Check } from "lucide-react";
import { toast } from "@/lib/toast";

interface ExtractedBidItem {
  description: string;
  quantity: number;
  unitPrice: number | null;
  totalCost: number | null;
  vendor: string | null;
  warrantyType: string | null;
  warrantyDuration: number | null;
}

interface Match {
  bidItemIndex: number;
  assetId: string;
  assetName: string;
  manufacturer: string | null;
  model: string | null;
  confidence: number;
}

interface FilePreview {
  file: File;
  preview: string;
  type: string;
}

interface BidExtractionTabProps {
  spaceId: string;
  spaces: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
  onTabChange: (tab: string) => void;
}

export function BidExtractionTab({
  spaceId,
  spaces,
  onClose,
  onSuccess,
  onTabChange,
}: BidExtractionTabProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [extractedItems, setExtractedItems] = useState<ExtractedBidItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceId);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingMatches, setEditingMatches] = useState<Record<number, string>>({});

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
      toast.error("No files", "Please upload bid document(s) first");
      return;
    }

    setAnalyzing(true);
    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f.file);
      });

      const response = await fetch("/api/assets/extract-from-bid", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to analyze bid files");
      }

      setExtractedItems(result.data.items || []);
      setMatches(result.data.matches || []);

      const totalItems = result.data.items?.length || 0;
      const matchedCount = result.data.matches?.length || 0;
      toast.success(
        "Analysis complete",
        `Extracted ${totalItems} bid item(s), matched ${matchedCount} to existing assets`
      );
    } catch (error) {
      toast.error(
        "Analysis failed",
        error instanceof Error ? error.message : "Failed to analyze bid files"
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItemField = (
    index: number,
    field: keyof ExtractedBidItem,
    value: unknown
  ) => {
    setExtractedItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setExtractedItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);

      // Also remove any matches for this item
      setMatches((prevMatches) =>
        prevMatches.filter((m) => m.bidItemIndex !== index)
      );

      return updated;
    });
  };

  const getMatchForItem = (itemIndex: number): Match | undefined => {
    const overrideAssetId = editingMatches[itemIndex];
    if (overrideAssetId === "none") return undefined;
    if (overrideAssetId) {
      // This would be a new manual match - not implemented in basic version
      return undefined;
    }
    return matches.find((m) => m.bidItemIndex === itemIndex);
  };

  const applyWarrantyUpdates = async () => {
    if (extractedItems.length === 0) {
      toast.error("No items", "No bid items to process");
      return;
    }

    setLoading(true);
    try {
      const updates: Array<{
        assetId: string;
        warrantyType: string | null;
        warrantyDuration: number | null;
        vendor: string | null;
        unitPrice: number | null;
      }> = [];

      const newAssets: Array<{
        name: string;
        manufacturer: string | null;
        model: string | null;
        sku: string | null;
        vendor: string | null;
        cost: number | null;
        status: string;
        notes: string | null;
        spaceId: string;
        systemId: string | null;
        warrantyType: string | null;
        warrantyDuration: number | null;
      }> = [];

      // Process each bid item
      for (let i = 0; i < extractedItems.length; i++) {
        const item = extractedItems[i];
        const match = getMatchForItem(i);

        if (match) {
          // Update existing asset with warranty info
          updates.push({
            assetId: match.assetId,
            warrantyType: item.warrantyType,
            warrantyDuration: item.warrantyDuration,
            vendor: item.vendor,
            unitPrice: item.unitPrice,
          });
        } else if (item.warrantyType || item.warrantyDuration) {
          // Create new asset for unmatched items with warranty info
          newAssets.push({
            name: item.description,
            manufacturer: null,
            model: null,
            sku: null,
            vendor: item.vendor,
            cost: item.unitPrice,
            status: "pending",
            notes: `Quantity: ${item.quantity}${item.totalCost ? ` | Total Cost: ${item.totalCost}` : ""}`,
            spaceId: selectedSpaceId,
            systemId: null,
            warrantyType: item.warrantyType,
            warrantyDuration: item.warrantyDuration,
          });
        }
      }

      if (updates.length === 0 && newAssets.length === 0) {
        toast.error("No updates", "No matching assets or warranty info to apply");
        return;
      }

      const response = await fetch("/api/assets/update-warranties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates, newAssets }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to apply warranty updates");
      }

      const resultData = result.data || {};
      toast.success(
        "Warranty updates applied",
        `Updated ${resultData.updatedAssets || 0} asset(s), created ${resultData.createdAssets || 0} new asset(s) with ${resultData.createdWarranties || 0} warranty record(s)`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Update failed",
        error instanceof Error ? error.message : "Failed to apply updates"
      );
    } finally {
      setLoading(false);
    }
  };

  // Review and Edit stage
  if (extractedItems.length > 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-white">
              Review Bid Items & Warranties ({extractedItems.length} items)
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Space Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium dark:text-gray-200">
              Default Space for New Assets
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

          {/* Items Table */}
          <div className="mb-6 max-h-[50vh] overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold dark:text-gray-200">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-gray-200">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-gray-200">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-gray-200">
                    Warranty
                  </th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-gray-200">
                    Matched Asset
                  </th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {extractedItems.map((item, idx) => {
                  const itemMatch = getMatchForItem(idx);
                  return (
                    <tr
                      key={idx}
                      className="bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      <td className="px-4 py-3 text-sm dark:text-gray-200">
                        {editingItemIndex === idx ? (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateItemField(idx, "description", e.target.value)
                            }
                            className="w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                        ) : (
                          <div className="line-clamp-2">{item.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-200">
                        {editingItemIndex === idx ? (
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemField(
                                idx,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-16 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-200">
                        {editingItemIndex === idx ? (
                          <input
                            type="number"
                            value={item.unitPrice || ""}
                            onChange={(e) =>
                              updateItemField(
                                idx,
                                "unitPrice",
                                e.target.value ? parseFloat(e.target.value) : null
                              )
                            }
                            className="w-24 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                        ) : item.unitPrice ? (
                          `$${item.unitPrice.toFixed(2)}`
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-200">
                        {editingItemIndex === idx ? (
                          <input
                            type="text"
                            value={item.warrantyType || ""}
                            onChange={(e) =>
                              updateItemField(
                                idx,
                                "warrantyType",
                                e.target.value || null
                              )
                            }
                            placeholder="e.g., 5-year limited"
                            className="w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                        ) : (
                          <div className="line-clamp-1 text-xs">
                            {item.warrantyType || "—"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-gray-200">
                        {itemMatch ? (
                          <div className="flex flex-col gap-1">
                            <div className="rounded bg-green-50 px-2 py-1 dark:bg-green-900">
                              <p className="font-medium text-green-900 dark:text-green-100">
                                {itemMatch.assetName}
                              </p>
                              <p className="text-xs text-green-700 dark:text-green-200">
                                {itemMatch.confidence}% match
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            No match
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setEditingItemIndex(
                                editingItemIndex === idx ? null : idx
                              )
                            }
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setExtractedItems([]);
                setMatches([]);
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
              onClick={applyWarrantyUpdates}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Add Warranty Info
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // File upload stage
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">
            Extract Bid & Add Warranties
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="mb-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors dark:border-gray-600 dark:bg-slate-800"
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Drag and drop bid documents here
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">or</p>
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
                Extract Bid Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
