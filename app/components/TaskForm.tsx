"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { validationSchemas } from "@/lib/validation";
import { toast } from "@/lib/toast";

interface Space {
  id: string;
  name: string;
}

interface System {
  id: string;
  name: string;
}

interface Task {
  [key: string]: unknown;
  id?: string;
  title: string;
  description: string | null;
  spaceId: string | null;
  systemId: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  assignedTo: string | null;
  notes: string | null;
}

interface TaskFormProps {
  task?: Task;
  spaces: Space[];
  systems: System[];
  onClose: () => void;
  onSuccess: () => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const STATUS_OPTIONS = ["pending", "in-progress", "blocked", "completed"];

export function TaskForm({
  task,
  spaces,
  systems,
  onClose,
  onSuccess,
}: TaskFormProps) {
  const isEditing = !!task?.id;
  const [formData, setFormData] = useState<Task>(
    task || {
      title: "",
      description: null,
      spaceId: spaces[0]?.id || null,
      systemId: null,
      priority: "medium",
      status: "pending",
      dueDate: null,
      assignedTo: null,
      notes: null,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let finalValue: any = value;
    if (type === "date") {
      finalValue = value === "" ? null : value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validationSchemas.task(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Validation failed", "Please check the form fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save task");
      }

      toast.success(
        isEditing ? "Task updated" : "Task created",
        `${formData.title} has been ${isEditing ? "updated" : "created"} successfully`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to save task"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">
            {isEditing ? "Edit Task" : "Add Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Paint master bedroom"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Add task details"
              rows={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Space */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Space
            </label>
            <select
              name="spaceId"
              value={formData.spaceId || ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">None</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          {/* System */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              System
            </label>
            <select
              name="systemId"
              value={formData.systemId || ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">None</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate || ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Assigned To
            </label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo || ""}
              onChange={handleChange}
              placeholder="e.g., John Smith"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              placeholder="Add any additional notes"
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-gray-300 px-4 py-2 font-medium dark:border-gray-600 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Task" : "Create Task"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
