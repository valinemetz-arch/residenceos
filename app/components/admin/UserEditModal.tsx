"use client";

import { useState } from "react";
import { X } from "lucide-react";
import RoleSelector from "./RoleSelector";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  company: string | null;
  isActive: boolean;
}

interface UserEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: any) => Promise<void>;
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onUpdate,
}: UserEditModalProps) {
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState(user.role);
  const [company, setCompany] = useState(user.company || "");
  const [isActive, setIsActive] = useState(user.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await onUpdate({
        name: name || null,
        role,
        company: company || null,
        isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#2D2D2D] rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold dark:text-white">Edit User</h2>
          <button
            onClick={onClose}
            className="text-[#5A5A5A] hover:text-brand-charcoal dark:hover:text-[#A8A8A8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-brand-cream dark:bg-brand-charcoal text-[#5A5A5A] dark:text-[#A8A8A8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-2">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              className="w-full px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
              disabled={loading}
            />
          </div>

          <RoleSelector
            value={role}
            onChange={setRole}
            disabled={loading}
            allowedRoles={["admin", "viewer"]}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-[#D4D9CE]"
            />
            <label
              htmlFor="isActive"
              className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]"
            >
              Active
            </label>
          </div>

          {error && (
            <div className="bg-brand-error/10 dark:bg-brand-error/25 border border-brand-error/30 dark:border-brand-error/40 rounded-lg p-3">
              <p className="text-sm text-brand-error">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg hover:bg-brand-cream dark:hover:bg-brand-charcoal disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-primary-dark disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
