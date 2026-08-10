"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatFileSize } from "@/lib/utils";

interface DocumentUploadProps {
  entityType: "space" | "asset" | "task" | "budgetItem";
  entityId: string;
  onSuccess: () => void;
}

const DOC_TYPES = [
  "other",
  "plan",
  "permit",
  "submittal",
  "report",
  "invoice",
  "bid",
];

export function DocumentUpload({
  entityType,
  entityId,
  onSuccess,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState("other");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show form to add details
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
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          fileName: uploadData.filename,
          fileUrl: uploadData.fileUrl,
          fileSize: uploadData.fileSize,
          fileType: uploadData.fileType,
          type: docType,
          description: description || null,
          [entityType === "budgetItem" ? "budgetItemId" : `${entityType}Id`]:
            entityId,
        }),
      });

      const docData = await docRes.json();

      if (!docRes.ok) {
        throw new Error(docData.error || "Failed to save document");
      }

      toast.success("Document uploaded", `${file.name} added successfully`);
      setShowForm(false);
      setDocType("other");
      setDescription("");
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
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!showForm ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-700"
        >
          <Upload className="h-4 w-4" />
          Add Document
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold dark:text-white">Upload Document</h3>
            <button
              onClick={() => {
                setShowForm(false);
                setDocType("other");
                setDescription("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {fileInputRef.current?.files?.[0]?.name}
            </p>
            {fileInputRef.current?.files?.[0] && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatFileSize(fileInputRef.current.files[0].size)}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium dark:text-gray-200">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
            >
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium dark:text-gray-200">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this document..."
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setDocType("other");
                setDescription("");
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
