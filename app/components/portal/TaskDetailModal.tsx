"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PhotoUpload } from "@/app/components/PhotoUpload";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/types";

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Urgent",
};

const PRIORITY_CLASS: Record<string, string> = {
  low: "tag tag-outline",
  medium: "tag tag-neutral",
  high: "tag tag-accent",
  critical: "tag tag-accent",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "tag tag-outline",
  in_progress: "tag tag-accent",
  blocked: "tag tag-accent",
  completed: "tag tag-neutral",
};

interface TaskDetailModalProps {
  task: TaskWithRelations;
  /** Contractors (and admins) can mark complete / attach photos; homeowners are view-only. */
  canAct: boolean;
  onClose: () => void;
  onUpdated: (task: TaskWithRelations) => void;
}

export function TaskDetailModal({ task, canAct, onClose, onUpdated }: TaskDetailModalProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleComplete = async () => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to update task");
      toast.success(newStatus === "completed" ? "Task completed" : "Task reopened", task.title);
      onUpdated(result.data);
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="classical"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32,31,29,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-bg)",
          width: 480,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "80vh",
          overflow: "auto",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 30px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            {task.space && <div className="card-kicker" style={{ marginBottom: 4 }}>{task.space.name}</div>}
            <h2 style={{ fontSize: 22 }}>{task.title}</h2>
          </div>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <span className={PRIORITY_CLASS[task.priority] || "tag tag-neutral"}>
            {PRIORITY_LABEL[task.priority] || task.priority}
          </span>
          <span className={STATUS_CLASS[task.status] || "tag tag-outline"}>
            {STATUS_LABEL[task.status] || task.status}
          </span>
          {task.dueDate && (
            <span className="tag tag-outline">Due {formatDate(new Date(task.dueDate))}</span>
          )}
        </div>

        {task.description && (
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>{task.description}</p>
        )}

        {task.notes && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-kicker">Note from GC</div>
            <p style={{ fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>{task.notes}</p>
          </div>
        )}

        {canAct && (
          <>
            <div className="hr" style={{ margin: "0 0 16px" }} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-secondary" onClick={() => setShowUpload((v) => !v)}>
                Attach a photo
              </button>
              <button className="btn btn-primary" onClick={toggleComplete} disabled={saving}>
                {task.status === "completed" ? "Reopen task" : "Mark complete"}
              </button>
            </div>
            {showUpload && (
              <div style={{ marginTop: 14 }}>
                <PhotoUpload
                  entityType="task"
                  entityId={task.id}
                  onSuccess={() => setShowUpload(false)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
