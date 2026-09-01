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
          <h2 style={{ fontSize: 22 }}>{isEditing ? "Edit System" : "Add System"}</h2>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              System Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., HVAC, Electrical, Plumbing"
              style={{ width: "100%" }}
            />
            {errors.name && (
              <p style={{ marginTop: 4, fontSize: 13, color: "var(--color-accent-700)" }}>{errors.name}</p>
            )}
          </div>

          {/* System Type */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              System Type
            </label>
            <select
              name="systemType"
              value={formData.systemType || ""}
              onChange={handleChange}
              style={{ width: "100%" }}
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
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Add notes about this system, specifications, or maintenance requirements"
              rows={3}
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{isEditing ? "Update System" : "Create System"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
