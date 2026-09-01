"use client";

import { useState } from "react";
import { Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "@/lib/toast";

interface PlatePhoto {
  id: string;
  url: string;
  caption: string | null;
}

export function PhotoPlateGrid({ photos: initial }: { photos: PlatePhoto[] }) {
  const [photos, setPhotos] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (photoId: string) => {
    if (!confirm("Delete this photo?")) return;
    setDeletingId(photoId);
    try {
      const res = await fetch(`/api/photos?id=${photoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success("Photo deleted", "Photo removed successfully");
    } catch {
      toast.error("Error", "Failed to delete photo");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
      {photos.map((photo) => (
        <div key={photo.id} className="plate" style={{ aspectRatio: "1", padding: 0, overflow: "hidden", position: "relative" }} title={photo.caption ?? undefined}>
          {photo.url ? (
            <img src={photo.url} alt={photo.caption || "Jobsite photo"} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "var(--color-neutral-300)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-neutral-600)",
              }}
            >
              <ImageIcon size={22} strokeWidth={1.6} />
            </div>
          )}
          <button
            className="btn btn-icon"
            onClick={() => handleDelete(photo.id)}
            disabled={deletingId === photo.id}
            aria-label="Delete photo"
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "var(--color-bg)",
            }}
          >
            {deletingId === photo.id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} strokeWidth={1.8} />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
