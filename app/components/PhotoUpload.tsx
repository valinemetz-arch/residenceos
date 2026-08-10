"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";

interface PhotoUploadProps {
  entityType: "space" | "asset" | "task" | "budgetItem";
  entityId: string;
  onSuccess: () => void;
}

export function PhotoUpload({
  entityType,
  entityId,
  onSuccess,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show form to add caption
    setShowForm(true);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Step 1: Upload file to storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Step 2: Create database record
      const photoRes = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: uploadData.fileUrl,
          caption: caption || null,
          [entityType === "budgetItem" ? "budgetItemId" : `${entityType}Id`]:
            entityId,
        }),
      });

      const photoData = await photoRes.json();

      if (!photoRes.ok) {
        throw new Error(photoData.error || "Failed to save photo");
      }

      toast.success("Photo uploaded", `${file.name} added successfully`);
      setShowForm(false);
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!showForm ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-700"
        >
          <Upload className="h-4 w-4" />
          Add Photo
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold dark:text-white">Upload Photo</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setCaption("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {fileInputRef.current?.files?.[0]?.name}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium dark:text-gray-200">
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a description..."
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setCaption("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-medium dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
