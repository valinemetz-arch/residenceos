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
    <div className="classical">
      {/* Header with Add Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <Plus size={16} strokeWidth={1.8} />
          Add System
        </button>
      </div>

      {/* Systems Grid */}
      {systems.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p className="card-meta">No systems yet. Create one to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleAddClick}>
            Create First System
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((system) => (
            <div key={system.id} className="card">
              <div className="card-title">{system.name}</div>
              {system.systemType && (
                <div className="card-meta" style={{ marginTop: 4 }}>
                  {system.systemType}
                </div>
              )}

              {system.description && (
                <p className="card-meta" style={{ marginTop: 12 }}>
                  {system.description}
                </p>
              )}

              <div className="hr" style={{ margin: "14px 0" }} />
              <div className="card-meta">
                {system._count?.assets || 0} Assets &middot; {system._count?.tasks || 0} Tasks
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 14 }}>
                <button className="btn btn-icon" onClick={() => handleEditClick(system)} aria-label="Edit system">
                  <Edit2 size={14} strokeWidth={1.8} />
                </button>
                <button
                  className="btn btn-icon"
                  onClick={() => handleDeleteClick(system.id)}
                  disabled={deletingId === system.id}
                  aria-label="Delete system"
                >
                  {deletingId === system.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} strokeWidth={1.8} />
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
    </div>
  );
}
