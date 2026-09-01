"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { TaskDetailModal } from "@/app/components/portal/TaskDetailModal";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";
import { formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/types";

const PRIORITY_LABEL: Record<string, string> = { low: "Low", medium: "Medium", high: "High", critical: "Urgent" };
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

type TaskFilter = "all" | "open" | "done";

export default function ContractorTasksPage() {
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [houseName, setHouseName] = useState("Nemetz Residence");
  const [phase, setPhase] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !contractor) return;
    (async () => {
      const [tasksRes, houseRes] = await Promise.all([
        fetch("/api/contractor/tasks"),
        fetch("/api/projects/house"),
      ]);
      const tasksData = await tasksRes.json();
      const houseData = await houseRes.json();
      if (tasksData.success) setTasks(tasksData.data);
      if (houseData.success) {
        setHouseName(houseData.data.name);
        setPhase(houseData.data.phase);
      }
      setLoadingTasks(false);
    })();
  }, [authLoading, contractor]);

  if (authLoading || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.status === "completed" : t.status !== "completed"
  );
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  return (
    <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeNames.join(", ")}>
      <PortalHeader projectName={houseName} pageTitle="Tasks" phase={phase} />

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {(["all", "open", "done"] as const).map((f) => (
          <button
            key={f}
            className="btn"
            style={filter === f ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" } : undefined}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "open" ? "Open" : "Done"}
          </button>
        ))}
      </div>

      {loadingTasks ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="card-meta">No tasks assigned to you yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Space</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr key={task.id} className="wp-row-tap" style={{ cursor: "pointer" }} onClick={() => setSelectedId(task.id)}>
                <td
                  style={
                    task.status === "completed"
                      ? { textDecoration: "line-through", color: "var(--color-neutral-600)" }
                      : undefined
                  }
                >
                  {task.title}
                </td>
                <td>{task.space?.name ?? "—"}</td>
                <td>
                  <span className={PRIORITY_CLASS[task.priority] || "tag tag-neutral"}>
                    {PRIORITY_LABEL[task.priority] || task.priority}
                  </span>
                </td>
                <td>
                  <span className={STATUS_CLASS[task.status] || "tag tag-outline"}>
                    {STATUS_LABEL[task.status] || task.status}
                  </span>
                </td>
                <td>{task.dueDate ? formatDate(new Date(task.dueDate)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <TaskDetailModal
          task={selected}
          canAct
          onClose={() => setSelectedId(null)}
          onUpdated={(updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
        />
      )}
    </PortalShell>
  );
}
