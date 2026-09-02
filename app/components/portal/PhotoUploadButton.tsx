"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "@/lib/toast";

interface Space {
  id: string;
  name: string;
}

interface PhotoUploadButtonProps {
  spaces: Space[];
  onUploaded: () => void;
}

// A general-purpose photo uploader for the Photos tab, where a photo isn't
// already scoped to one Space/Task/BudgetItem the way the existing
// PhotoUpload component's callers are - the uploader picks the Space here.
export function PhotoUploadButton({ spaces, onUploaded }: PhotoUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [spaceId, setSpaceId] = useState(spaces[0]?.id ?? "");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setOpen(false);
    setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      toast.error("Error", "Choose at least one photo");
      return;
    }
    if (!spaceId) {
      toast.error("Error", "Choose a space for these photos");
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityType", "space");
        formData.append("entityId", spaceId);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

        const photoRes = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: uploadData.fileUrl, caption: caption || null, spaceId }),
        });
        const photoData = await photoRes.json();
        if (!photoRes.ok) throw new Error(photoData.error || "Failed to save photo");
      }

      toast.success("Photos uploaded", `${files.length} photo(s) added`);
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
        Add Photos
      </button>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 20, maxWidth: 420 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="card-title" style={{ fontSize: 15 }}>
          Add Photos
        </div>
        <button className="btn btn-icon" onClick={reset} aria-label="Cancel">
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
            Space
          </label>
          <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} style={{ width: "100%" }}>
            {spaces.length === 0 && <option value="">No spaces yet</option>}
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
            Photos
          </label>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple />
        </div>

        <div>
          <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
            Caption (optional, applied to all)
          </label>
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} style={{ width: "100%" }} />
        </div>

        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !spaceId}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} strokeWidth={1.8} />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
