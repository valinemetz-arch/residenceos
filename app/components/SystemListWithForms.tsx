"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { SystemForm } from "./SystemForm";
import { toast } from "@/lib/toast";

interface System {
  [key: string]: unknown;
  id: string;
  name: string;
  description: string | null;
  systemType: string | null;
  createdAt: string;
  _count?: {
    assets: number;
    tasks: number;
  };
}

export function SystemListWithForms() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<System | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/systems");
      const data = await response.json();

      if (data.success) setSystems(data.data);
    } catch (error) {
      toast.error("Error", "Failed to load systems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClick = () => {
    setSelectedSystem(undefined);
    setShowForm(true);
  };

  const handleEditClick = (system: System) => {
    setSelectedSystem(system);
    setShowForm(true);
  };

  const handleDeleteClick = async (systemId: string) => {
    if (!confirm("Are you sure you want to delete this system?")) {
      return;
    }

    setDeletingId(systemId);
    try {
      const response = await fetch(`/api/systems/${systemId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete system");
      }

      toast.success("System deleted", "System has been removed successfully");
      await loadData();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to delete system"
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
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold dark:text-white">Building Systems</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          Add System
        </button>
      </div>

      {/* Systems Grid */}
      {systems.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-slate-800">
          <p className="text-gray-600 dark:text-gray-300">
            No systems yet. Create one to get started.
          </p>
          <button
            onClick={handleAddClick}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create First System
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((system) => (
            <div
              key={system.id}
              className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold dark:text-white">
                    {system.name}
                  </h3>
                  {system.systemType && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {system.systemType}
                    </p>
                  )}
                </div>
              </div>

              {system.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {system.description}
                </p>
              )}

              <div className="space-y-2 text-sm mb-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  📦 <span className="font-medium">{system._count?.assets || 0}</span> Assets
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  ✓ <span className="font-medium">{system._count?.tasks || 0}</span> Tasks
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEditClick(system)}
                  className="flex-1 rounded border border-gray-300 p-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-slate-800 flex items-center justify-center gap-1 text-sm"
                >
                  <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  <span className="dark:text-gray-300">Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(system.id)}
                  disabled={deletingId === system.id}
                  className="flex-1 rounded border border-red-300 p-2 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:hover:bg-red-900/20 flex items-center justify-center gap-1 text-sm"
                >
                  {deletingId === system.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Delete</span>
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
        <SystemForm
          system={selectedSystem}
          onClose={() => {
            setShowForm(false);
            setSelectedSystem(undefined);
          }}
          onSuccess={loadData}
        />
      )}
    </>
  );
}
