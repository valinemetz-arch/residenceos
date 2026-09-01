"use client";

interface RoleSelectorProps {
  value: string;
  onChange: (role: string) => void;
  label?: string;
  disabled?: boolean;
  allowedRoles?: string[];
}

const ROLE_LABELS: Record<string, { label: string; description: string }> = {
  owner: {
    label: "Owner",
    description: "Full access, can manage all users and settings"
  },
  admin: {
    label: "Admin",
    description: "Can manage users, projects, and view analytics"
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to projects and reports"
  },
  contractor: {
    label: "Contractor",
    description: "Self-registered contractor with trade-based project access"
  }
};

export default function RoleSelector({
  value,
  onChange,
  label = "Role",
  disabled = false,
  allowedRoles = ["admin", "viewer"]
}: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-md bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white disabled:bg-brand-cream dark:disabled:bg-brand-charcoal disabled:text-[#5A5A5A]"
      >
        <option value="">Select a role</option>
        {allowedRoles.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]?.label || role}
          </option>
        ))}
      </select>
      {value && ROLE_LABELS[value] && (
        <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
          {ROLE_LABELS[value].description}
        </p>
      )}
    </div>
  );
}
