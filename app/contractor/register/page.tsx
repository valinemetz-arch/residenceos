"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import TradeSelector from "@/app/components/admin/TradeSelector";

export default function ContractorRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    companyName: "",
    contactName: "",
    phone: "",
  });

  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
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

    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return;
    }

    if (selectedTrades.length === 0) {
      setError("Please select at least one trade");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/contractor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
          companyName: formData.companyName,
          contactName: formData.contactName || undefined,
          phone: formData.phone || undefined,
          trades: selectedTrades,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/contractor/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Registration Successful!
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Your contractor account has been created. Redirecting to login...
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
            Contractor Registration
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Create your contractor account to access projects
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="your@email.com"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="Your Company"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name (Optional)
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                placeholder="Your Name"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>

            {/* Trades */}
            <div className="pt-2">
              <TradeSelector
                selectedTradeIds={selectedTrades}
                onTradesChange={setSelectedTrades}
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
                disabled={loading}
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
                  setFormData({ ...formData, passwordConfirm: e.target.value })
                }
                placeholder="••••••••"
                required
                disabled={loading}
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
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Login Link */}
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
              Already have an account?{" "}
              <Link
                href="/contractor/login"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
