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
          className="flex items-center gap-2 rounded border border-[#D4D9CE] px-4 py-2 text-sm font-medium hover:bg-brand-cream dark:border-[#1F1F1F] dark:hover:bg-brand-charcoal"
        >
          <Upload className="h-4 w-4" />
          Add Photo
        </button>
      ) : (
        <div className="rounded-lg border border-[#D4D9CE] bg-white p-4 dark:border-[#1F1F1F] dark:bg-[#2D2D2D]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold dark:text-white">Upload Photo</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setCaption("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-[#5A5A5A] hover:text-[#1F1F1F] dark:text-[#A8A8A8] dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3">
            <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
              {fileInputRef.current?.files?.[0]?.name}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium dark:text-white">
              Caption (optional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a description..."
              rows={2}
              className="mt-1 w-full rounded border border-[#D4D9CE] px-3 py-2 dark:border-[#1F1F1F] dark:bg-brand-charcoal dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setCaption("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="flex-1 rounded border border-[#D4D9CE] px-3 py-2 text-sm font-medium dark:border-[#1F1F1F]"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-primary-dark disabled:opacity-50"
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
