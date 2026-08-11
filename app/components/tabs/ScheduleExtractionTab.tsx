"use client";

import { useState } from "react";
import { X, Upload, FileText, Image, Loader2, Edit2, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface ExtractedDoor {
  type: string;
  quantity: number;
  size: string | null;
  location: string | null;
  material: string | null;
  hardware: string | null;
  room: string | null;
}

interface ExtractedWindow {
  type: string;
  quantity: number;
  size: string | null;
  location: string | null;
  material: string | null;
  glazing: string | null;
  room: string | null;
}

interface ExtractedSchedule {
  doors: ExtractedDoor[];
  windows: ExtractedWindow[];
}

interface FilePreview {
  file: File;
  preview: string;
  type: string;
}

interface ScheduleExtractionTabProps {
  spaceId: string;
  spaces: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess: () => void;
  onTabChange: (tab: string) => void;
}

export function ScheduleExtractionTab({
  spaceId,
  spaces,
  onClose,
  onSuccess,
  onTabChange,
}: ScheduleExtractionTabProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [extractedSchedule, setExtractedSchedule] = useState<ExtractedSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState(spaceId);
  const [editingDoorIndex, setEditingDoorIndex] = useState<number | null>(null);
  const [editingWindowIndex, setEditingWindowIndex] = useState<number | null>(null);

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

      const response = await fetch("/api/assets/extract-schedules", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to analyze files");
      }

      setExtractedSchedule(result.data || { doors: [], windows: [] });
      const totalItems = (result.data?.doors?.length || 0) + (result.data?.windows?.length || 0);
      toast.success(
        "Analysis complete",
        `Extracted ${totalItems} door/window items from schedule(s)`
      );
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
    if (!extractedSchedule) {
      toast.error("No schedules", "Please analyze files first");
      return;
    }

    const totalItems = extractedSchedule.doors.length + extractedSchedule.windows.length;
    if (totalItems === 0) {
      toast.error("No items", "No doors or windows found to create");
      return;
    }

    setLoading(true);
    try {
      // Create placeholder assets for all doors and windows
      const assets = [
        ...extractedSchedule.doors.flatMap((door) =>
          Array(door.quantity).fill(null).map((_, idx) => ({
            name: `${door.type} Door${door.quantity > 1 ? ` ${idx + 1}` : ""}`,
            manufacturer: null,
            model: null,
            sku: door.size || null,
            vendor: null,
            cost: null,
            status: "placeholder",
            notes: `Type: ${door.type}${door.material ? `, Material: ${door.material}` : ""}${door.hardware ? `, Hardware: ${door.hardware}` : ""}${door.location ? `, Location: ${door.location}` : ""}`,
            spaceId: selectedSpaceId,
            systemId: null,
          }))
        ),
        ...extractedSchedule.windows.flatMap((window) =>
          Array(window.quantity).fill(null).map((_, idx) => ({
            name: `${window.type} Window${window.quantity > 1 ? ` ${idx + 1}` : ""}`,
            manufacturer: null,
            model: null,
            sku: window.size || null,
            vendor: null,
            cost: null,
            status: "placeholder",
            notes: `Type: ${window.type}${window.material ? `, Material: ${window.material}` : ""}${window.glazing ? `, Glazing: ${window.glazing}` : ""}${window.location ? `, Location: ${window.location}` : ""}`,
            spaceId: selectedSpaceId,
            systemId: null,
          }))
        ),
      ];

      const response = await fetch("/api/assets/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create assets");
      }

      toast.success(
        "Assets created",
        `Successfully created ${result.data.length} placeholder asset(s)`
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

  const updateDoor = (index: number, field: keyof ExtractedDoor, value: unknown) => {
    if (!extractedSchedule) return;
    const updated = { ...extractedSchedule };
    (updated.doors[index] as unknown as Record<string, unknown>)[field] = value;
    setExtractedSchedule(updated);
  };

  const updateWindow = (index: number, field: keyof ExtractedWindow, value: unknown) => {
    if (!extractedSchedule) return;
    const updated = { ...extractedSchedule };
    (updated.windows[index] as unknown as Record<string, unknown>)[field] = value;
    setExtractedSchedule(updated);
  };

  const removeDoor = (index: number) => {
    if (!extractedSchedule) return;
    const updated = { ...extractedSchedule };
    updated.doors.splice(index, 1);
    setExtractedSchedule(updated);
  };

  const removeWindow = (index: number) => {
    if (!extractedSchedule) return;
    const updated = { ...extractedSchedule };
    updated.windows.splice(index, 1);
    setExtractedSchedule(updated);
  };

  // Review and Edit stage
  if (extractedSchedule) {
    const totalItems = extractedSchedule.doors.length + extractedSchedule.windows.length;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-white">
              Review Extracted Schedule ({totalItems} items)
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

          <div className="mb-6 space-y-4 max-h-[50vh] overflow-y-auto">
            {/* Doors Section */}
            {extractedSchedule.doors.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold dark:text-white">
                  Doors ({extractedSchedule.doors.length})
                </h3>
                <div className="space-y-2">
                  {extractedSchedule.doors.map((door, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-slate-800"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="font-semibold dark:text-white">
                            {door.type} x{door.quantity}
                          </p>
                          {door.room && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Room: {door.room}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setEditingDoorIndex(editingDoorIndex === idx ? null : idx)
                            }
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeDoor(idx)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {editingDoorIndex === idx && (
                        <div className="grid gap-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                          <input
                            type="text"
                            value={door.type}
                            onChange={(e) => updateDoor(idx, "type", e.target.value)}
                            placeholder="Door type"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="number"
                            value={door.quantity}
                            onChange={(e) => updateDoor(idx, "quantity", parseInt(e.target.value) || 0)}
                            placeholder="Quantity"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={door.size || ""}
                            onChange={(e) => updateDoor(idx, "size", e.target.value || null)}
                            placeholder="Size/Width"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={door.material || ""}
                            onChange={(e) => updateDoor(idx, "material", e.target.value || null)}
                            placeholder="Material"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={door.hardware || ""}
                            onChange={(e) => updateDoor(idx, "hardware", e.target.value || null)}
                            placeholder="Hardware"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={door.room || ""}
                            onChange={(e) => updateDoor(idx, "room", e.target.value || null)}
                            placeholder="Room/Location"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={door.location || ""}
                            onChange={(e) => updateDoor(idx, "location", e.target.value || null)}
                            placeholder="Door location (e.g., NW corner)"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                      )}

                      {editingDoorIndex !== idx && (
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {door.size && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Size: </span>
                              <span className="dark:text-gray-200">{door.size}</span>
                            </div>
                          )}
                          {door.material && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Material: </span>
                              <span className="dark:text-gray-200">{door.material}</span>
                            </div>
                          )}
                          {door.hardware && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Hardware: </span>
                              <span className="dark:text-gray-200">{door.hardware}</span>
                            </div>
                          )}
                          {door.location && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Location: </span>
                              <span className="dark:text-gray-200">{door.location}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Windows Section */}
            {extractedSchedule.windows.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold dark:text-white">
                  Windows ({extractedSchedule.windows.length})
                </h3>
                <div className="space-y-2">
                  {extractedSchedule.windows.map((window, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-slate-800"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <p className="font-semibold dark:text-white">
                            {window.type} x{window.quantity}
                          </p>
                          {window.room && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Room: {window.room}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setEditingWindowIndex(editingWindowIndex === idx ? null : idx)
                            }
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeWindow(idx)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {editingWindowIndex === idx && (
                        <div className="grid gap-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                          <input
                            type="text"
                            value={window.type}
                            onChange={(e) => updateWindow(idx, "type", e.target.value)}
                            placeholder="Window type"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="number"
                            value={window.quantity}
                            onChange={(e) => updateWindow(idx, "quantity", parseInt(e.target.value) || 0)}
                            placeholder="Quantity"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={window.size || ""}
                            onChange={(e) => updateWindow(idx, "size", e.target.value || null)}
                            placeholder="Size (WxH)"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={window.material || ""}
                            onChange={(e) => updateWindow(idx, "material", e.target.value || null)}
                            placeholder="Material"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={window.glazing || ""}
                            onChange={(e) => updateWindow(idx, "glazing", e.target.value || null)}
                            placeholder="Glazing type"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={window.room || ""}
                            onChange={(e) => updateWindow(idx, "room", e.target.value || null)}
                            placeholder="Room/Location"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={window.location || ""}
                            onChange={(e) => updateWindow(idx, "location", e.target.value || null)}
                            placeholder="Window location (e.g., NW corner)"
                            className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                      )}

                      {editingWindowIndex !== idx && (
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {window.size && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Size: </span>
                              <span className="dark:text-gray-200">{window.size}</span>
                            </div>
                          )}
                          {window.material && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Material: </span>
                              <span className="dark:text-gray-200">{window.material}</span>
                            </div>
                          )}
                          {window.glazing && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Glazing: </span>
                              <span className="dark:text-gray-200">{window.glazing}</span>
                            </div>
                          )}
                          {window.location && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Location: </span>
                              <span className="dark:text-gray-200">{window.location}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setExtractedSchedule(null);
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
                <>Create Placeholder Assets</>
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
            Extract Door & Window Schedules
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
            Drag and drop architectural plans here
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
                Extract Schedule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
