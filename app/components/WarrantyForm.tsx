"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Zap } from "lucide-react";
import { validationSchemas } from "@/lib/validation";
import { toast } from "@/lib/toast";

interface Asset {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  sku?: string;
  warrantyMonths?: number;
  purchaseDate?: string;
}

interface Space {
  id: string;
  name: string;
}

interface Warranty {
  [key: string]: unknown;
  id?: string;
  title: string;
  description: string | null;
  coverageScope: string | null;
  startDate: string;
  endDate: string;
  months: number | null;
  assetId: string | null;
  spaceId: string | null;
  provider: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  claimProcess: string | null;
  serialNumber: string | null;
  status: string;
}

interface WarrantyFormProps {
  warranty?: Warranty;
  assets: Asset[];
  spaces: Space[];
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = ["active", "expired", "claimed", "voided"];

export function WarrantyForm({
  warranty,
  assets,
  spaces,
  onClose,
  onSuccess,
}: WarrantyFormProps) {
  const isEditing = !!warranty?.id;
  const [formData, setFormData] = useState<Warranty>(
    warranty || {
      title: "",
      description: null,
      coverageScope: null,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      months: 12,
      assetId: null,
      spaceId: null,
      provider: null,
      phone: null,
      email: null,
      website: null,
      claimProcess: null,
      serialNumber: null,
      status: "active",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);

  const handleAssetChange = async (assetId: string) => {
    setFormData((prev) => ({
      ...prev,
      assetId: assetId || null,
    }));

    if (!assetId) return;

    // Fetch full asset details
    setIsLoadingAsset(true);
    try {
      const response = await fetch(`/api/assets/${assetId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const asset = result.data;
        const today = new Date();
        const warrantyMonths = asset.warrantyMonths || 12;
        const endDate = new Date(today.getTime() + warrantyMonths * 30 * 24 * 60 * 60 * 1000);

        setFormData((prev) => ({
          ...prev,
          title: `${asset.name}${asset.manufacturer ? ` - ${asset.manufacturer}` : ""} Warranty`,
          provider: asset.manufacturer || null,
          serialNumber: asset.sku || null,
          months: warrantyMonths,
          startDate: today.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }));

        // Try to look up warranty info from manufacturer
        if (asset.manufacturer && asset.model) {
          try {
            const warrantyRes = await fetch("/api/lookup-warranty", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                manufacturer: asset.manufacturer,
                model: asset.model,
                productName: asset.name,
              }),
            });

            if (warrantyRes.ok) {
              const warrantyData = await warrantyRes.json();
              if (warrantyData.success && warrantyData.data) {
                setFormData((prev) => ({
                  ...prev,
                  ...warrantyData.data,
                }));
                toast.success(
                  "Warranty info found",
                  "Auto-populated from manufacturer"
                );
              }
            }
          } catch (error) {
            // Silently fail - we already have the basic info from the asset
          }
        }
      }
    } catch (error) {
      toast.error("Error", "Failed to load asset details");
    } finally {
      setIsLoadingAsset(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let finalValue: any = value;
    if (type === "number") {
      finalValue = value === "" ? null : parseInt(value);
    }

    // Special handling for assetId
    if (name === "assetId") {
      handleAssetChange(value);
      return;
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

    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Validation failed", "Title, start date, and end date are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/warranties/${warranty?.id}` : "/api/warranties";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save warranty");
      }

      toast.success(
        isEditing ? "Warranty updated" : "Warranty created",
        `${formData.title} has been ${isEditing ? "updated" : "created"} successfully`
      );

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to save warranty"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">
            {isEditing ? "Edit Warranty" : "Add Warranty"}
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
              Warranty Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Kitchen Faucet - 5 Year Warranty"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Manufacturer/Provider
            </label>
            <input
              type="text"
              name="provider"
              value={formData.provider || ""}
              onChange={handleChange}
              placeholder="e.g., Kohler, Sub-Zero, etc"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Asset/Space Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium dark:text-gray-200">
                  Asset
                </label>
                {isLoadingAsset && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                )}
              </div>
              <select
                name="assetId"
                value={formData.assetId || ""}
                onChange={handleChange}
                disabled={isLoadingAsset}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white disabled:opacity-50"
              >
                <option value="">Select an asset (auto-populates warranty info)</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
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
                <option value="">Select a space (optional)</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coverage Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">
                Coverage Scope
              </label>
              <select
                name="coverageScope"
                value={formData.coverageScope || ""}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select scope</option>
                <option value="Full">Full Coverage</option>
                <option value="Limited">Limited Coverage</option>
                <option value="Parts Only">Parts Only</option>
                <option value="Labor Only">Labor Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">
                Duration (months)
              </label>
              <input
                type="number"
                name="months"
                value={formData.months ?? ""}
                onChange={handleChange}
                placeholder="12"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Serial Number
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber || ""}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website || ""}
              onChange={handleChange}
              placeholder="https://..."
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              Coverage Description
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="What's covered, limitations, exclusions, etc."
              rows={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Claim Process */}
          <div>
            <label className="block text-sm font-medium dark:text-gray-200">
              How to File a Claim
            </label>
            <textarea
              name="claimProcess"
              value={formData.claimProcess || ""}
              onChange={handleChange}
              placeholder="Step-by-step instructions for filing a warranty claim"
              rows={2}
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
                  {isEditing ? "Update Warranty" : "Create Warranty"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
