"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, FileText } from "lucide-react";
import { SpaceForm } from "./SpaceForm";
import { SpaceDetail } from "./SpaceDetail";
import { toast } from "@/lib/toast";
import type { SpaceBase } from "@/lib/types";

interface Space extends SpaceBase {
  id: string;
  _count: {
    assets: number;
    tasks: number;
    photos: number;
  };
}

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

const STATUS_CLASS: Record<string, string> = {
  planning: "tag tag-outline",
  pending: "tag tag-outline",
  "in-progress": "tag tag-neutral",
  completed: "tag tag-neutral",
};

export function SpaceListWithForms() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>();
  const [detailSpaceId, setDetailSpaceId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/spaces");
      const result = await response.json();
      if (result.success) {
        setSpaces(result.data);
      }
    } catch (error) {
      toast.error("Error", "Failed to load spaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpaces();
  }, []);

  const handleAddClick = () => {
    setSelectedSpace(undefined);
    setShowForm(true);
  };

  const handleEditClick = (space: Space) => {
    setSelectedSpace(space);
    setShowForm(true);
  };

  const handleDeleteClick = async (spaceId: string) => {
    if (!confirm("Are you sure you want to delete this space?")) {
      return;
    }

    setDeletingId(spaceId);
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete space");
      }

      toast.success("Space deleted", "Space has been removed successfully");
      await loadSpaces();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to delete space"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Add Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <Plus size={16} strokeWidth={1.8} />
          Add Space
        </button>
      </div>

      {/* Spaces Grid */}
      {spaces.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p className="card-meta">No spaces yet. Create one to get started.</p>
          <button className="btn btn-primary" onClick={handleAddClick} style={{ marginTop: 16 }}>
            Create First Space
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <div key={space.id} className="card">
              {/* Title */}
              <h3 className="card-title" style={{ marginBottom: 6 }}>
                {space.name}
              </h3>

              {/* Meta */}
              <p className="card-meta" style={{ marginBottom: 10 }}>
                {space.building}
              </p>

              {/* Stats */}
              <div className="card-meta" style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 2 }}>
                {space.squareFootage && <span>{space.squareFootage} SF</span>}
                <span>{space._count.assets} Assets</span>
                <span>{space._count.tasks} Tasks</span>
                <span>{space._count.photos} Photos</span>
              </div>

              {/* Status Badge */}
              <div style={{ marginBottom: 14 }}>
                <span className={STATUS_CLASS[space.status] || "tag tag-outline"}>
                  {STATUS_LABEL[space.status] || space.status}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => {
                    setDetailSpaceId(space.id);
                    setShowDetail(true);
                  }}
                  className="btn"
                  style={{ flex: 1 }}
                >
                  <FileText size={14} strokeWidth={1.8} />
                  Files
                </button>
                <button
                  onClick={() => handleEditClick(space)}
                  className="btn"
                  style={{ flex: 1 }}
                >
                  <Edit2 size={14} strokeWidth={1.8} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(space.id)}
                  disabled={deletingId === space.id}
                  className="btn"
                  style={{ flex: 1 }}
                >
                  {deletingId === space.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} strokeWidth={1.8} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <SpaceForm
          space={selectedSpace}
          onClose={() => {
            setShowForm(false);
            setSelectedSpace(undefined);
          }}
          onSuccess={loadSpaces}
        />
      )}

      {/* Detail Modal */}
      {showDetail && detailSpaceId && (
        <SpaceDetail
          spaceId={detailSpaceId}
          spaceName={
            spaces.find((s) => s.id === detailSpaceId)?.name || "Space"
          }
          onClose={() => {
            setShowDetail(false);
            setDetailSpaceId(null);
            loadSpaces();
          }}
        />
      )}
    </>
  );
}
