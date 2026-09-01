"use client";

import { useState } from "react";
import { X, Mail } from "lucide-react";

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
}

export default function InviteAdminModal({
  isOpen,
  onClose,
  onInvite,
}: InviteAdminModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await onInvite(email);
      setSuccess(true);
      setEmail("");
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#2D2D2D] rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold dark:text-white">Invite Admin</h2>
          <button
            onClick={onClose}
            className="text-[#5A5A5A] hover:text-brand-charcoal dark:hover:text-[#A8A8A8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="bg-brand-success/10 dark:bg-brand-success/25 border border-brand-success/30 dark:border-brand-success/40 rounded-lg p-4">
            <p className="text-brand-success">
              Invitation sent successfully to {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#5A5A5A]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white placeholder-[#5A5A5A] dark:placeholder-[#A8A8A8]"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-brand-error/10 dark:bg-brand-error/25 border border-brand-error/30 dark:border-brand-error/40 rounded-lg p-3">
                <p className="text-sm text-brand-error">{error}</p>
              </div>
            )}

            <div className="border-brand-info/30 bg-brand-info/10 dark:bg-brand-info/15 border rounded-lg p-3">
              <p className="text-sm text-brand-info">
                The invitee will receive an email with a link to set up their account. The link expires in 7 days.
              </p>
            </div>

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
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
