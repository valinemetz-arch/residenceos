"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { TaskForm } from "./TaskForm";
import { TaskDetailModal } from "./portal/TaskDetailModal";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils";

interface Space {
  id: string;
  name: string;
}

interface System {
  id: string;
  name: string;
}

import type { TaskWithRelations } from "@/lib/types";

interface Task extends TaskWithRelations {}

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

type TaskFilter = "all" | "open" | "done";

export function TaskListWithForms() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, spacesRes, systemsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/spaces"),
        fetch("/api/systems"),
      ]);

      const tasksData = await tasksRes.json();
      const spacesData = await spacesRes.json();
      const systemsData = await systemsRes.json();

      if (tasksData.success) setTasks(tasksData.data);
      if (spacesData.success) setSpaces(spacesData.data);
      if (systemsData.success) setSystems(systemsData.data);
    } catch (error) {
      toast.error("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClick = () => {
    setSelectedTask(undefined);
    setShowForm(true);
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setShowForm(true);
  };

  const handleDeleteClick = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setDeletingId(taskId);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete task");
      }

      toast.success("Task deleted", "Task has been removed successfully");
      await loadData();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to delete task"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.status === "completed" : t.status !== "completed"
  );

  const detailTask = tasks.find((t) => t.id === detailTaskId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="classical">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn"
            style={filter === "all" ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" } : undefined}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className="btn"
            style={filter === "open" ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" } : undefined}
            onClick={() => setFilter("open")}
          >
            Open
          </button>
          <button
            className="btn"
            style={filter === "done" ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" } : undefined}
            onClick={() => setFilter("done")}
          >
            Done
          </button>
        </div>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <Plus size={16} strokeWidth={1.8} />
          Add Task
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p className="card-meta">No tasks yet. Create one to get started.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Space</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} className="wp-row-tap" style={{ cursor: "pointer" }} onClick={() => setDetailTaskId(task.id)}>
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
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button className="btn btn-icon" onClick={() => handleEditClick(task)} aria-label="Edit task">
                      <Edit2 size={14} strokeWidth={1.8} />
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => handleDeleteClick(task.id)}
                      disabled={deletingId === task.id}
                      aria-label="Delete task"
                    >
                      {deletingId === task.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} strokeWidth={1.8} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <TaskForm
          task={selectedTask}
          spaces={spaces}
          systems={systems}
          onClose={() => {
            setShowForm(false);
            setSelectedTask(undefined);
          }}
          onSuccess={loadData}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          canAct
          onClose={() => setDetailTaskId(null)}
          onUpdated={(updated) =>
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          }
        />
      )}
    </div>
  );
}
