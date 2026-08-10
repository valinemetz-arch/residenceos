"use client";

import { useState, useEffect } from "react";
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

import type { AssetWithRelations } from "@/lib/types";

interface Asset extends AssetWithRelations {}

type AssetFormState = {
  id?: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  sku: string | null;
  finish: string | null;
  cost: number | null;
  vendor: string | null;
  purchaseDate: string | null;
  installDate: string | null;
  warrantyMonths: number | null;
  spaceId: string;
  systemId: string | null;
  status: string;
  notes: string | null;
};

interface AssetFormProps {
  asset?: Asset;
  spaces: Space[];
  systems: System[];
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = ["pending", "ordered", "in-stock", "active", "archived"];

export function AssetForm({
  asset,
  spaces,
  systems,
  onClose,
  onSuccess,
}: AssetFormProps) {
  const isEditing = !!asset?.id;
  const [formData, setFormData] = useState<AssetFormState>(
    asset || {
      name: "",
      manufacturer: null,
      model: null,
      sku: null,
      finish: null,
      cost: null,
      vendor: null,
      purchaseDate: null,
      installDate: null,
      warrantyMonths: null,
      spaceId: spaces[0]?.id || "",
      systemId: null,
      status: "pending",
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
    if (type === "number") {
      finalValue = value === "" ? null : parseFloat(value);
    }
    if (type === "date") {
      finalValue = value === "" ? null : value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    // Clear error for this field
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

    const validation = validationSchemas.asset(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Validation failed", "Please check the form fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/assets/${asset.id}` : "/api/assets";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save asset");
      }

      toast.success(
        isEditing ? "Asset updated" : "Asset created",
        `${formData.name} has been ${isEditing ? "updated" : "created"} successfully`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to save asset"
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
            {isEditing ? "Edit Asset" : "Add Asset"}
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
              Asset Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Water Heater"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Space */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Space *
            </label>
            <select
              name="spaceId"
              value={formData.spaceId}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            >
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

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Manufacturer
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer || ""}
              onChange={handleChange}
              placeholder="e.g., Rheem"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model || ""}
              onChange={handleChange}
              placeholder="e.g., Professional Classic"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              SKU
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku || ""}
              onChange={handleChange}
              placeholder="Part number"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Cost ($)
            </label>
            <input
              type="number"
              name="cost"
              value={formData.cost ?? ""}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Vendor
            </label>
            <input
              type="text"
              name="vendor"
              value={formData.vendor || ""}
              onChange={handleChange}
              placeholder="e.g., Home Depot"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Purchase Date
            </label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate || ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Warranty Months */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Warranty (months)
            </label>
            <input
              type="number"
              name="warrantyMonths"
              value={formData.warrantyMonths ?? ""}
              onChange={handleChange}
              placeholder="e.g., 36"
              min="0"
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
                <>{isEditing ? "Update Asset" : "Create Asset"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
