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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: "var(--color-neutral-700)",
};

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <h2 style={{ fontSize: 22 }}>
            {isEditing ? "Edit Space" : "Add Space"}
          </h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Master Bedroom"
              className="w-full"
            />
            {errors.name && (
              <p style={{ marginTop: 4, fontSize: 12, color: "var(--color-accent-700)" }}>{errors.name}</p>
            )}
          </div>

          {/* Building */}
          <div>
            <label style={labelStyle}>Building</label>
            <select
              name="building"
              value={formData.building}
              onChange={handleChange}
              className="w-full"
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
            <label style={labelStyle}>Floor</label>
            <input
              type="number"
              name="floor"
              value={formData.floor ?? ""}
              onChange={handleChange}
              placeholder="e.g., 1"
              className="w-full"
            />
          </div>

          {/* Square Footage */}
          <div>
            <label style={labelStyle}>Square Footage</label>
            <input
              type="number"
              name="squareFootage"
              value={formData.squareFootage ?? ""}
              onChange={handleChange}
              placeholder="e.g., 450"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="e.g., Primary bedroom with ensuite"
              rows={3}
              className="w-full"
            />
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full"
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
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
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
                  <Loader2 size={16} className="animate-spin" />
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
