"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { validationSchemas } from "@/lib/validation";
import { toast } from "@/lib/toast";
import type { BudgetItemBase } from "@/lib/types";

interface Space {
  id: string;
  name: string;
}

interface BudgetFormProps {
  item?: BudgetItemBase;
  spaces: Space[];
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "New build",
  "Change order",
  "Repair",
  "Utilities",
  "Maintenance",
  "Other",
];
const STATUS_OPTIONS = ["planning", "estimated", "in-progress", "completed"];

export function BudgetForm({
  item,
  spaces,
  onClose,
  onSuccess,
}: BudgetFormProps) {
  const isEditing = !!item?.id;
  const [formData, setFormData] = useState<BudgetItemBase>(
    item || {
      name: "",
      description: "",
      category: "New build",
      spaceId: spaces[0]?.id || null,
      budgetedAmount: null,
      actualAmount: null,
      status: "planning",
      notes: null,
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining =
    formData.budgetedAmount && formData.actualAmount
      ? formData.budgetedAmount - formData.actualAmount
      : null;

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

    const validation = validationSchemas.budgetItem(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Validation failed", "Please check the form fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/budget-items/${item.id}`
        : "/api/budget-items";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save budget item");
      }

      toast.success(
        isEditing ? "Budget item updated" : "Budget item created",
        `${formData.description} has been ${isEditing ? "updated" : "created"} successfully`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to save budget item"
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
            {isEditing ? "Edit Budget Item" : "Add Budget Item"}
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
          {/* Description */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Item Name *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description ?? ""}
              onChange={handleChange}
              placeholder="e.g., Master Bedroom Renovation"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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

          {/* Budgeted Amount */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Budgeted Amount ($)
            </label>
            <input
              type="number"
              name="budgetedAmount"
              value={formData.budgetedAmount ?? ""}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Actual Amount */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Actual Amount ($)
            </label>
            <input
              type="number"
              name="actualAmount"
              value={formData.actualAmount ?? ""}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Remaining Display */}
          {remaining !== null && (
            <div
              className={`rounded px-3 py-2 text-sm font-medium ${
                remaining >= 0
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              Remaining: ${remaining.toFixed(2)}
            </div>
          )}

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
                <>
                  {isEditing ? "Update Item" : "Create Item"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
