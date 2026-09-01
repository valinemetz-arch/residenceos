"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { TaskDetailModal } from "./TaskDetailModal";
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

interface OverviewRecentTasksProps {
  initialTasks: TaskWithRelations[];
  /** Contractors can act on tasks (mark complete, attach photos); homeowners are view-only. */
  canAct: boolean;
}

export function OverviewRecentTasks({ initialTasks, canAct }: OverviewRecentTasksProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  if (tasks.length === 0) {
    return <p className="card-meta">No tasks yet.</p>;
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            className="card wp-row-tap"
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedId(task.id)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div>
                <div
                  className="card-title"
                  style={
                    task.status === "completed"
                      ? { textDecoration: "line-through", color: "var(--color-neutral-600)" }
                      : undefined
                  }
                >
                  {task.title}
                </div>
                <div className="card-meta" style={{ marginTop: 6 }}>
                  {task.space?.name ?? "Unassigned"}
                  {task.dueDate ? ` · Due ${formatDate(new Date(task.dueDate))}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <span className={PRIORITY_CLASS[task.priority] || "tag tag-neutral"}>
                  {PRIORITY_LABEL[task.priority] || task.priority}
                </span>
                <span className={STATUS_CLASS[task.status] || "tag tag-outline"}>
                  {STATUS_LABEL[task.status] || task.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <TaskDetailModal
          task={selected}
          canAct={canAct}
          onClose={() => setSelectedId(null)}
          onUpdated={(updated) =>
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }
        />
      )}
    </>
  );
}
