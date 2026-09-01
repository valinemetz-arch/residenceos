"use client";

import { useState } from "react";
import { Edit2, Trash2, AlertCircle } from "lucide-react";
import UserEditModal from "./UserEditModal";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  company: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UserListTableProps {
  users: User[];
  onDelete: (userId: string) => Promise<void>;
  onUpdate: (userId: string, data: any) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function UserListTable({
  users,
  onDelete,
  onUpdate,
  onRefresh,
}: UserListTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(userId: string) {
    if (!window.confirm("Are you sure you want to deactivate this user?")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setDeletingId(userId);
      await onDelete(userId);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setLoading(false);
      setDeletingId(null);
    }
  }

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case "owner":
        return "bg-brand-secondary/15 dark:bg-brand-secondary/25 text-brand-accent dark:text-brand-secondary";
      case "admin":
        return "bg-brand-info/10 dark:bg-brand-info/25 text-brand-info dark:text-brand-info";
      case "viewer":
        return "bg-brand-gray/15 dark:bg-brand-gray/25 text-brand-dark-gray dark:text-white";
      default:
        return "bg-brand-gray/15 dark:bg-brand-gray/25 text-brand-dark-gray dark:text-white";
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-brand-error/10 dark:bg-brand-error/25 border border-brand-error/30 dark:border-brand-error/40 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-brand-error flex-shrink-0" />
          <p className="text-sm text-brand-error">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D4D9CE] dark:border-[#1F1F1F]">
              <th className="px-4 py-3 text-left text-sm font-semibold text-brand-charcoal dark:text-white">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-brand-charcoal dark:text-white">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-brand-charcoal dark:text-white">
                Role
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-brand-charcoal dark:text-white">
                Company
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-brand-charcoal dark:text-white">
                Last Login
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-brand-charcoal dark:text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={`border-b border-[#D4D9CE] dark:border-[#1F1F1F] ${
                  !user.isActive ? "opacity-60" : ""
                }`}
              >
                <td className="px-4 py-3 text-sm text-brand-charcoal dark:text-white">
                  {user.email}
                  {!user.isActive && (
                    <span className="ml-2 text-xs text-[#5A5A5A] dark:text-[#A8A8A8]">
                      (inactive)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                  {user.name || "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                  {user.company || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                  {formatDate(user.lastLoginAt)}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {user.role !== "owner" && (
                    <>
                      <button
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-brand-primary dark:text-brand-secondary hover:bg-brand-primary/5 dark:hover:bg-brand-secondary/10 rounded"
                        disabled={loading}
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={loading || deletingId === user.id}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-brand-error hover:bg-brand-error/5 dark:hover:bg-brand-error/10 rounded disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-[#5A5A5A] dark:text-[#A8A8A8]">
          No users found
        </div>
      )}

      {editingUser && (
        <UserEditModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={async (data) => {
            await onUpdate(editingUser.id, data);
            setEditingUser(null);
            await onRefresh();
          }}
        />
      )}
    </div>
  );
}
