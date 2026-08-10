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

  const statusColors: Record<string, string> = {
    planning: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "in-progress":
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
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
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold dark:text-white">Spaces</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          Add Space
        </button>
      </div>

      {/* Spaces Grid */}
      {spaces.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-slate-800">
          <p className="text-gray-600 dark:text-gray-300">
            No spaces yet. Create one to get started.
          </p>
          <button
            onClick={handleAddClick}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create First Space
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800"
            >
              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold dark:text-white">
                {space.name}
              </h3>

              {/* Meta */}
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                {space.building}
              </p>

              {/* Stats */}
              <div className="mb-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {space.squareFootage && (
                  <p>📐 {space.squareFootage} SF</p>
                )}
                <p>🏠 {space._count.assets} Assets</p>
                <p>✓ {space._count.tasks} Tasks</p>
                <p>📸 {space._count.photos} Photos</p>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                    statusColors[space.status] || statusColors.planning
                  }`}
                >
                  {space.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDetailSpaceId(space.id);
                    setShowDetail(true);
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded border border-blue-300 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <FileText className="h-4 w-4" />
                  Files
                </button>
                <button
                  onClick={() => handleEditClick(space)}
                  className="flex flex-1 items-center justify-center gap-1 rounded border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(space.id)}
                  disabled={deletingId === space.id}
                  className="flex flex-1 items-center justify-center gap-1 rounded border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  {deletingId === space.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
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
