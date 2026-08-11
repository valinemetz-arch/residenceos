"use client";

import { useState } from "react";
import { X, Upload, FileText, Image, Loader2, Edit2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface ExtractedSpace {
  name: string;
  estimatedDimensions: string | null;
  squareFootage: number | null;
  locationDescription: string | null;
  floor: string | null;
  building: string | null;
}

interface FilePreview {
  file: File;
  preview: string;
  type: string;
}

interface SpaceCreationTabProps {
  onClose: () => void;
  onSuccess: () => void;
  onTabChange: (tab: string) => void;
}

export function SpaceCreationTab({
  onClose,
  onSuccess,
  onTabChange,
}: SpaceCreationTabProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [extractedSpaces, setExtractedSpaces] = useState<ExtractedSpace[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [editingSpaceIndex, setEditingSpaceIndex] = useState<number | null>(null);

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

      const response = await fetch("/api/spaces/bulk-import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to analyze files");
      }

      setExtractedSpaces(result.data || []);
      if (result.data && result.data.length > 0) {
        toast.success(
          "Analysis complete",
          `Extracted ${result.data.length} space(s) from floor plan(s)`
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

  const createSpaces = async () => {
    if (extractedSpaces.length === 0) {
      toast.error("No spaces", "Please analyze files first");
      return;
    }

    setLoading(true);
    try {
      const spacesToCreate = extractedSpaces.map((space) => ({
        name: space.name,
        floor: space.floor || null,
        building: space.building || "Main Residence",
        squareFootage: space.squareFootage || null,
        description: space.locationDescription || null,
      }));

      const response = await fetch("/api/spaces/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaces: spacesToCreate }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create spaces");
      }

      toast.success(
        "Spaces created",
        `Successfully created ${result.data.length} space(s)`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Creation failed",
        error instanceof Error ? error.message : "Failed to create spaces"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateSpaceField = (
    index: number,
    field: keyof ExtractedSpace,
    value: unknown
  ) => {
    setExtractedSpaces((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Review and Edit stage
  if (extractedSpaces.length > 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-white">
              Review Extracted Spaces ({extractedSpaces.length})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6 space-y-3 max-h-[50vh] overflow-y-auto">
            {extractedSpaces.map((space, idx) => (
              <div
                key={idx}
                className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-800"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold dark:text-white">
                      {space.name || "(No name)"}
                    </p>
                    {space.locationDescription && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {space.locationDescription}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setEditingSpaceIndex(
                        editingSpaceIndex === idx ? null : idx
                      )
                    }
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>

                {editingSpaceIndex === idx && (
                  <div className="grid gap-2 pt-3">
                    <input
                      type="text"
                      value={space.name}
                      onChange={(e) =>
                        updateSpaceField(idx, "name", e.target.value)
                      }
                      placeholder="Space name"
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={space.floor || ""}
                      onChange={(e) =>
                        updateSpaceField(idx, "floor", e.target.value)
                      }
                      placeholder="Floor (e.g., 1st, 2nd)"
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={space.building || ""}
                      onChange={(e) =>
                        updateSpaceField(idx, "building", e.target.value)
                      }
                      placeholder="Building"
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    />
                    <input
                      type="text"
                      value={space.estimatedDimensions || ""}
                      onChange={(e) =>
                        updateSpaceField(idx, "estimatedDimensions", e.target.value)
                      }
                      placeholder="Estimated dimensions (e.g., 12x15 ft)"
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    />
                    <input
                      type="number"
                      value={space.squareFootage ?? ""}
                      onChange={(e) =>
                        updateSpaceField(
                          idx,
                          "squareFootage",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Square footage"
                      step="0.01"
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    />
                    <textarea
                      value={space.locationDescription || ""}
                      onChange={(e) =>
                        updateSpaceField(idx, "locationDescription", e.target.value)
                      }
                      placeholder="Location description"
                      rows={2}
                      className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                )}

                {editingSpaceIndex !== idx && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {space.floor && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Floor:{" "}
                        </span>
                        <span className="dark:text-gray-200">{space.floor}</span>
                      </div>
                    )}
                    {space.building && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Building:{" "}
                        </span>
                        <span className="dark:text-gray-200">{space.building}</span>
                      </div>
                    )}
                    {space.estimatedDimensions && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Dimensions:{" "}
                        </span>
                        <span className="dark:text-gray-200">
                          {space.estimatedDimensions}
                        </span>
                      </div>
                    )}
                    {space.squareFootage && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Area:{" "}
                        </span>
                        <span className="dark:text-gray-200">
                          {space.squareFootage} sqft
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setExtractedSpaces([]);
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
              onClick={createSpaces}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create All Spaces</>
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
            Create Spaces from Floor Plans
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
            Drag and drop floor plans here
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
                Analyze Floor Plans
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
