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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:text-gray-500"
      >
        <option value="">Select a role</option>
        {allowedRoles.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]?.label || role}
          </option>
        ))}
      </select>
      {value && ROLE_LABELS[value] && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {ROLE_LABELS[value].description}
        </p>
      )}
    </div>
  );
}
