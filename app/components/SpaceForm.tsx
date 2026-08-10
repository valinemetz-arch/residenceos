"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { validationSchemas, ValidationError } from "@/lib/validation";
import { toast } from "@/lib/toast";
import type { SpaceBase } from "@/lib/types";

interface SpaceFormProps {
  space?: SpaceBase;
  onClose: () => void;
  onSuccess: () => void;
}

type Space = SpaceBase;

const STATUS_OPTIONS = ["planning", "pending", "in-progress", "completed"];
const BUILDING_OPTIONS = ["Main Residence", "Detached ADU", "Garage", "Outdoor"];

export function SpaceForm({ space, onClose, onSuccess }: SpaceFormProps) {
  const isEditing = !!space?.id;
  const [formData, setFormData] = useState<Space>(
    space || {
      name: "",
      building: "Main Residence",
      floor: null,
      squareFootage: null,
      description: null,
      status: "planning",
      notes: null,
    }
  );
  const [errors, setErrors] = useState<ValidationError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let finalValue: any = value;
    if (type === "number") {
      finalValue = value === "" ? null : parseFloat(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    // Clear error for this field when user starts typing
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

    // Validate
    const validation = validationSchemas.space(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Validation failed", "Please check the form fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/spaces/${space.id}`
        : "/api/spaces";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save space");
      }

      toast.success(
        isEditing ? "Space updated" : "Space created",
        `${formData.name} has been ${isEditing ? "updated" : "created"} successfully`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to save space"
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
            {isEditing ? "Edit Space" : "Add Space"}
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
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Master Bedroom"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Building */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Building
            </label>
            <select
              name="building"
              value={formData.building}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            >
              {BUILDING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Floor
            </label>
            <input
              type="number"
              name="floor"
              value={formData.floor ?? ""}
              onChange={handleChange}
              placeholder="e.g., 1"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Square Footage */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Square Footage
            </label>
            <input
              type="number"
              name="squareFootage"
              value={formData.squareFootage ?? ""}
              onChange={handleChange}
              placeholder="e.g., 450"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
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
              placeholder="e.g., Primary bedroom with ensuite"
              rows={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
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
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
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
                <>{isEditing ? "Update Space" : "Create Space"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
