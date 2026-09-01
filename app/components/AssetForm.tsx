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

interface Trade {
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
  size: string | null;
  cost: number | null;
  vendor: string | null;
  purchaseDate: string | null;
  installDate: string | null;
  warrantyMonths: number | null;
  spaceId: string;
  systemId: string | null;
  tradeId: string | null;
  status: string;
  notes: string | null;
};

interface AssetFormProps {
  asset?: Asset;
  spaces: Space[];
  systems: System[];
  trades: Trade[];
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = ["pending", "ordered", "in-stock", "active", "archived"];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-neutral-700)",
  marginBottom: 6,
};

const fieldWrapStyle: React.CSSProperties = { marginBottom: 14 };

const errorStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "var(--color-accent-700)",
};

const helpStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "var(--color-neutral-600)",
};

export function AssetForm({
  asset,
  spaces,
  systems,
  trades,
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
      size: null,
      cost: null,
      vendor: null,
      purchaseDate: null,
      installDate: null,
      warrantyMonths: null,
      spaceId: spaces[0]?.id || "",
      systemId: null,
      tradeId: null,
      status: "pending",
      notes: null,
    }
  );
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>(
    asset?.spaceId ? [asset.spaceId] : spaces[0] ? [spaces[0].id] : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSpace = (spaceId: string) => {
    setSelectedSpaceIds((prev) =>
      prev.includes(spaceId)
        ? prev.filter((id) => id !== spaceId)
        : [...prev, spaceId]
    );
    if (errors.spaceId) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.spaceId;
        return newErrors;
      });
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

    const validation = validationSchemas.asset({
      ...formData,
      spaceId: selectedSpaceIds[0] || "",
    });
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Validation failed", "Please check the form fields");
      return;
    }
    if (selectedSpaceIds.length === 0) {
      setErrors((prev) => ({ ...prev, spaceId: "Select at least one space." }));
      toast.error("Validation failed", "Please select at least one space");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const response = await fetch(`/api/assets/${asset.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, spaceId: selectedSpaceIds[0] }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to save asset");
        }

        toast.success("Asset updated", `${formData.name} has been updated successfully`);
      } else {
        const responses = await Promise.all(
          selectedSpaceIds.map((spaceId) =>
            fetch("/api/assets", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...formData, spaceId }),
            })
          )
        );

        const results = await Promise.all(responses.map((r) => r.json()));
        const failed = responses.filter((r) => !r.ok);
        if (failed.length > 0) {
          const firstError = results.find((r) => r?.error)?.error;
          throw new Error(firstError || "Failed to create asset");
        }

        toast.success(
          "Asset created",
          selectedSpaceIds.length > 1
            ? `${formData.name} has been added to ${selectedSpaceIds.length} spaces`
            : `${formData.name} has been created successfully`
        );
      }

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
          width: 480,
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
          <h2 style={{ fontSize: 22 }}>{isEditing ? "Edit Asset" : "Add Asset"}</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Asset Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Water Heater"
              style={{ width: "100%" }}
            />
            {errors.name && <p style={errorStyle}>{errors.name}</p>}
          </div>

          {/* Space */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>{isEditing ? "Space *" : "Space(s) *"}</label>
            {isEditing ? (
              <select
                name="spaceId"
                value={selectedSpaceIds[0] || ""}
                onChange={(e) => setSelectedSpaceIds([e.target.value])}
                style={{ width: "100%" }}
              >
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <div
                  style={{
                    maxHeight: 160,
                    overflowY: "auto",
                    border: "1px solid var(--color-divider)",
                    borderRadius: "var(--radius-md)",
                    padding: 8,
                  }}
                >
                  {spaces.map((space) => (
                    <label
                      key={space.id}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpaceIds.includes(space.id)}
                        onChange={() => toggleSpace(space.id)}
                      />
                      {space.name}
                    </label>
                  ))}
                </div>
                <p style={helpStyle}>
                  Select multiple spaces to add this item to each of them at once.
                </p>
              </>
            )}
            {errors.spaceId && <p style={errorStyle}>{errors.spaceId}</p>}
          </div>

          {/* System */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>System</label>
            <select
              name="systemId"
              value={formData.systemId || ""}
              onChange={handleChange}
              style={{ width: "100%" }}
            >
              <option value="">None</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trade */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Trade</label>
            <select
              name="tradeId"
              value={formData.tradeId || ""}
              onChange={handleChange}
              style={{ width: "100%" }}
            >
              <option value="">None</option>
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.name}
                </option>
              ))}
            </select>
            <p style={helpStyle}>
              Determines which bidding contractors see this item in their project scope.
            </p>
          </div>

          {/* Manufacturer */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Manufacturer</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer || ""}
              onChange={handleChange}
              placeholder="e.g., Rheem"
              style={{ width: "100%" }}
            />
          </div>

          {/* Model */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Model</label>
            <input
              type="text"
              name="model"
              value={formData.model || ""}
              onChange={handleChange}
              placeholder="e.g., Professional Classic"
              style={{ width: "100%" }}
            />
          </div>

          {/* SKU */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>SKU</label>
            <input
              type="text"
              name="sku"
              value={formData.sku || ""}
              onChange={handleChange}
              placeholder="Part number"
              style={{ width: "100%" }}
            />
          </div>

          {/* Size */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Size / Dimensions</label>
            <input
              type="text"
              name="size"
              value={formData.size || ""}
              onChange={handleChange}
              placeholder={`e.g., 3'-0" x 6'-8", 36" wide`}
              style={{ width: "100%" }}
            />
          </div>

          {/* Finish */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Finish / Selection</label>
            <input
              type="text"
              name="finish"
              value={formData.finish || ""}
              onChange={handleChange}
              placeholder="e.g., Panel Ready, Matte White, Polished Nickel"
              style={{ width: "100%" }}
            />
          </div>

          {/* Cost */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Cost ($)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost ?? ""}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              style={{ width: "100%" }}
            />
          </div>

          {/* Vendor */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Vendor</label>
            <input
              type="text"
              name="vendor"
              value={formData.vendor || ""}
              onChange={handleChange}
              placeholder="e.g., Home Depot"
              style={{ width: "100%" }}
            />
          </div>

          {/* Purchase Date */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Purchase Date</label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate || ""}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>

          {/* Warranty Months */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Warranty (months)</label>
            <input
              type="number"
              name="warrantyMonths"
              value={formData.warrantyMonths ?? ""}
              onChange={handleChange}
              placeholder="e.g., 36"
              min="0"
              style={{ width: "100%" }}
            />
          </div>

          {/* Status */}
          <div style={fieldWrapStyle}>
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

          {/* Notes */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Notes (install location, wiring/prewire needs, etc.)</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              placeholder={`e.g., "Recessed ceiling speaker, covered patio north side, needs low-voltage run from AV closet"`}
              rows={2}
              style={{ width: "100%" }}
            />
            <p style={helpStyle}>
              Visible to contractors bidding this item's trade — use it for exactly where something goes and what it needs (extra wiring, prewire, circuits, etc).
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
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
                <>{isEditing ? "Update Asset" : "Create Asset"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
