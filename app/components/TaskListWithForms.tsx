"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, CheckCircle2, Circle, FileText } from "lucide-react";
import { TaskForm } from "./TaskForm";
import { TaskDetail } from "./TaskDetail";
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

export function TaskListWithForms() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleCompleteToggle = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update task");

      toast.success(
        newStatus === "completed" ? "Task completed" : "Task reopened",
        task.title
      );
      await loadData();
    } catch (error) {
      toast.error("Error", "Failed to update task status");
    }
  };

  const priorityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
        <h1 className="text-3xl font-bold dark:text-white">Tasks</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          Add Task
        </button>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-slate-800">
          <p className="text-gray-600 dark:text-gray-300">
            No tasks yet. Create one to get started.
          </p>
          <button
            onClick={handleAddClick}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create First Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-4 rounded-lg border p-4 ${
                task.status === "completed"
                  ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-slate-800/50"
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-800"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleCompleteToggle(task)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {task.status === "completed" ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold ${
                    task.status === "completed"
                      ? "line-through text-gray-500 dark:text-gray-400"
                      : "dark:text-white"
                  }`}
                >
                  {task.title}
                </h3>
                <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300">
                  {task.space && (
                    <span>📍 {task.space.name}</span>
                  )}
                  {task.dueDate && (
                    <span>📅 {formatDate(new Date(task.dueDate))}</span>
                  )}
                  {(task.assignedToUser || task.assignedToContractor) && (
                    <span>
                      👤{" "}
                      {task.assignedToUser
                        ? task.assignedToUser.name || task.assignedToUser.email
                        : task.assignedToContractor?.companyName}
                    </span>
                  )}
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      priorityColors[task.priority] || priorityColors.medium
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-shrink-0 gap-2">
                <button
                  onClick={() => {
                    setDetailTaskId(task.id);
                    setShowDetail(true);
                  }}
                  className="rounded border border-blue-300 p-2 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
                >
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </button>
                <button
                  onClick={() => handleEditClick(task)}
                  className="rounded border border-gray-300 p-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-slate-700"
                >
                  <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => handleDeleteClick(task.id)}
                  disabled={deletingId === task.id}
                  className="rounded border border-red-300 p-2 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:hover:bg-red-900/20"
                >
                  {deletingId === task.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-600" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
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

      {/* Detail Modal */}
      {showDetail && detailTaskId && (
        <TaskDetail
          taskId={detailTaskId}
          taskTitle={
            tasks.find((t) => t.id === detailTaskId)?.title || "Task"
          }
          onClose={() => {
            setShowDetail(false);
            setDetailTaskId(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
