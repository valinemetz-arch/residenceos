"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete: () => void;
}

export function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (photoId: string) => {
    if (!confirm("Delete this photo?")) return;

    setDeletingId(photoId);
    try {
      const response = await fetch(`/api/photos?id=${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success("Photo deleted", "Photo removed successfully");
      onDelete();
    } catch (error) {
      toast.error("Error", "Failed to delete photo");
    } finally {
      setDeletingId(null);
    }
  };

  if (photos.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No photos yet
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative rounded-lg border border-gray-200 overflow-hidden dark:border-gray-700"
        >
          <img
            src={photo.url}
            alt={photo.caption || "Photo"}
            className="h-40 w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
            {photo.caption && (
              <p className="text-xs text-white line-clamp-2">
                {photo.caption}
              </p>
            )}
            <button
              onClick={() => handleDelete(photo.id)}
              disabled={deletingId === photo.id}
              className="self-end rounded bg-red-600 p-1.5 hover:bg-red-700 disabled:opacity-50"
            >
              {deletingId === photo.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Trash2 className="h-4 w-4 text-white" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
