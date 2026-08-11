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
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "admin":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "viewer":
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Role
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Company
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Last Login
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={`border-b border-gray-100 dark:border-gray-800 ${
                  !user.isActive ? "opacity-60" : ""
                }`}
              >
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {user.email}
                  {!user.isActive && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      (inactive)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
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
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {user.company || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(user.lastLoginAt)}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {user.role !== "owner" && (
                    <>
                      <button
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        disabled={loading}
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={loading || deletingId === user.id}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
