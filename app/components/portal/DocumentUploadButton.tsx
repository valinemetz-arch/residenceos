"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";

interface Space {
  id: string;
  name: string;
}

interface DocumentUploadButtonProps {
  spaces: Space[];
  onUploaded: () => void;
}

const CATEGORIES: { value: string; label: string; needsSpace?: boolean }[] = [
  { value: "plan", label: "Floorplan" },
  { value: "spec_sheet", label: "Specification" },
  { value: "takeoff", label: "Takeoff" },
  { value: "rendering", label: "Rendering", needsSpace: true },
];

const MAX_FILE_SIZE = 200 * 1024 * 1024;

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// A general-purpose document uploader for the Project tab's Floorplans /
// Specifications / Takeoffs / Renderings categories.
export function DocumentUploadButton({ spaces, onUploaded }: DocumentUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(CATEGORIES[0].value);
  const [spaceId, setSpaceId] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const category = CATEGORIES.find((c) => c.value === type)!;

  const reset = () => {
    setOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      toast.error("Error", "Choose at least one file");
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} exceeds the 200MB limit`);
        }

        const blob = await upload(
          `uploads/document/${sanitizePathSegment(type)}/${Date.now()}-${sanitizePathSegment(file.name)}`,
          file,
          {
            access: "public",
            handleUploadUrl: "/api/upload/client",
            multipart: true,
          }
        );

        const docRes = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            type,
            fileUrl: blob.url,
            fileName: blob.pathname.split("/").pop() || file.name,
            fileSize: file.size,
            fileType: file.type,
            spaceId: spaceId || null,
          }),
        });
        const responseText = await docRes.text();
        let docData: { message?: string } = {};
        try {
          docData = JSON.parse(responseText);
        } catch {
          // Preserve infrastructure errors that return plain text or HTML.
        }
        if (!docRes.ok) {
          throw new Error(docData.message || responseText || "Failed to save document");
        }
      }

      toast.success("Uploaded", `${files.length} file(s) added`);
      reset();
      onUploaded();
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ marginBottom: 20 }}>
        <Upload size={16} strokeWidth={1.8} />
        Add Document
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 20, maxWidth: 420 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="card-title" style={{ fontSize: 15 }}>
          Add Document
        </div>
        <button className="btn btn-icon" onClick={reset} aria-label="Cancel">
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
            Category
          </label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%" }}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {category.needsSpace && (
          <div>
            <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
              Room
            </label>
            <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} style={{ width: "100%" }}>
              <option value="">Unassigned</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
            Files
          </label>
          <input ref={fileInputRef} type="file" accept="application/pdf,.pdf,image/*" multiple />
        </div>

        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} strokeWidth={1.8} />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
