"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface System {
  [key: string]: unknown;
  id?: string;
  name: string;
  description: string | null;
  systemType: string | null;
}

interface SystemFormProps {
  system?: System;
  onClose: () => void;
  onSuccess: () => void;
}

const SYSTEM_TYPES = [
  "HVAC",
  "Electrical",
  "Plumbing",
  "Solar",
  "Pool",
  "Roofing",
  "Foundation",
  "Structural",
  "Security",
  "Fire Suppression",
  "Other",
];

export function SystemForm({ system, onClose, onSuccess }: SystemFormProps) {
  const isEditing = !!system?.id;
  const [formData, setFormData] = useState<System>(
    system || {
      name: "",
      description: null,
      systemType: null,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value || null,
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

    if (!formData.name) {
      toast.error("Validation failed", "System name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/systems/${system?.id}` : "/api/systems";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save system");
      }

      toast.success(
        isEditing ? "System updated" : "System created",
        `${formData.name} has been ${isEditing ? "updated" : "created"} successfully`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to save system"
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
            {isEditing ? "Edit System" : "Add System"}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              System Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., HVAC, Electrical, Plumbing"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* System Type */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              System Type
            </label>
            <select
              name="systemType"
              value={formData.systemType || ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select a type</option>
              {SYSTEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
              placeholder="Add notes about this system, specifications, or maintenance requirements"
              rows={3}
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
                <>
                  {isEditing ? "Update System" : "Create System"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
