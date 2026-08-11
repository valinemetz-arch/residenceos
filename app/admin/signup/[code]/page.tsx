"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader } from "lucide-react";

interface InvitationData {
  email: string;
  isValid: boolean;
}

export default function AdminSignupPage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();

  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    passwordConfirm: "",
  });

  useEffect(() => {
    verifyInvitation();
  }, []);

  async function verifyInvitation() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/invitations/${params.code}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid invitation");
      }

      const data = await response.json();
      setInvitationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: params.code,
          name: formData.name.trim(),
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create admin account");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/app/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Verifying invitation...
          </p>
        </div>
      </div>
    );
  }

  if (!invitationData || !invitationData.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Invalid Invitation
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {error || "This invitation link is invalid or has expired."}
          </p>
          <Link
            href="/"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Account Created!
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Your admin account has been successfully created. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Admin Sign Up
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Complete your admin account setup
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email - Pre-filled from invitation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={invitationData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This email was specified in your invitation
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Your Name"
                required
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                required
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passwordConfirm: e.target.value,
                  })
                }
                placeholder="••••••••"
                required
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition"
            >
              {submitting ? "Creating Account..." : "Create Admin Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
