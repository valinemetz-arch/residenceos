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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--color-neutral-700)",
  marginBottom: 6,
};

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
          maxHeight: "85vh",
          overflow: "auto",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          padding: "28px 30px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 22 }}>
            {isEditing ? "Edit Budget Item" : "Add Budget Item"}
          </h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Description */}
          <div>
            <label style={labelStyle}>Item Name *</label>
            <input
              type="text"
              name="description"
              value={formData.description ?? ""}
              onChange={handleChange}
              placeholder="e.g., Master Bedroom Renovation"
              style={{ width: "100%" }}
            />
            {errors.description && (
              <p style={{ marginTop: 4, fontSize: 12, color: "var(--color-accent-700)" }}>
                {errors.description}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ width: "100%" }}
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
            <label style={labelStyle}>Space</label>
            <select
              name="spaceId"
              value={formData.spaceId || ""}
              onChange={handleChange}
              style={{ width: "100%" }}
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
            <label style={labelStyle}>Budgeted Amount ($)</label>
            <input
              type="number"
              name="budgetedAmount"
              value={formData.budgetedAmount ?? ""}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              style={{ width: "100%" }}
            />
          </div>

          {/* Actual Amount */}
          <div>
            <label style={labelStyle}>Actual Amount ($)</label>
            <input
              type="number"
              name="actualAmount"
              value={formData.actualAmount ?? ""}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              style={{ width: "100%" }}
            />
          </div>

          {/* Remaining Display */}
          {remaining !== null && (
            <div
              className="card"
              style={{
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: remaining >= 0 ? "var(--color-text)" : "var(--color-accent-700)",
              }}
            >
              Remaining: ${remaining.toFixed(2)}
            </div>
          )}

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

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              placeholder="Add any additional notes"
              rows={2}
              style={{ width: "100%" }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
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
