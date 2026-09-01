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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "var(--color-neutral-700)",
    marginBottom: 6,
  };

  return (
    <div
      className="classical"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32,31,29,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-bg)",
          width: 640,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "90vh",
          overflow: "auto",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 30px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <h2 style={{ fontSize: 22 }}>{isEditing ? "Edit Warranty" : "Add Warranty"}</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Warranty Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Kitchen Faucet - 5 Year Warranty"
              style={{ width: "100%" }}
            />
            {errors.title && (
              <p style={{ marginTop: 4, fontSize: 13, color: "var(--color-accent-700)" }}>{errors.title}</p>
            )}
          </div>

          {/* Provider */}
          <div>
            <label style={labelStyle}>Manufacturer/Provider</label>
            <input
              type="text"
              name="provider"
              value={formData.provider || ""}
              onChange={handleChange}
              placeholder="e.g., Kohler, Sub-Zero, etc"
              style={{ width: "100%" }}
            />
          </div>

          {/* Asset/Space Selection */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={labelStyle}>Asset</label>
                {isLoadingAsset && <Loader2 size={12} className="animate-spin" style={{ color: "var(--color-accent-700)" }} />}
              </div>
              <select
                name="assetId"
                value={formData.assetId || ""}
                onChange={handleChange}
                disabled={isLoadingAsset}
                style={{ width: "100%" }}
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
              <label style={labelStyle}>Space</label>
              <select
                name="spaceId"
                value={formData.spaceId || ""}
                onChange={handleChange}
                style={{ width: "100%" }}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Coverage Scope</label>
              <select
                name="coverageScope"
                value={formData.coverageScope || ""}
                onChange={handleChange}
                style={{ width: "100%" }}
              >
                <option value="">Select scope</option>
                <option value="Full">Full Coverage</option>
                <option value="Limited">Limited Coverage</option>
                <option value="Parts Only">Parts Only</option>
                <option value="Labor Only">Labor Only</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duration (months)</label>
              <input
                type="number"
                name="months"
                value={formData.months ?? ""}
                onChange={handleChange}
                placeholder="12"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Serial Number */}
          <div>
            <label style={labelStyle}>Serial Number</label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber || ""}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>

          {/* Contact Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label style={labelStyle}>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website || ""}
              onChange={handleChange}
              placeholder="https://..."
              style={{ width: "100%" }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Coverage Description</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="What's covered, limitations, exclusions, etc."
              rows={3}
              style={{ width: "100%" }}
            />
          </div>

          {/* Claim Process */}
          <div>
            <label style={labelStyle}>How to File a Claim</label>
            <textarea
              name="claimProcess"
              value={formData.claimProcess || ""}
              onChange={handleChange}
              placeholder="Step-by-step instructions for filing a warranty claim"
              rows={2}
              style={{ width: "100%" }}
            />
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ width: "100%" }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="hr" style={{ margin: "4px 0 0" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update Warranty" : "Create Warranty"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
