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
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#2D2D2D] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#2D2D2D] rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-brand-success" />
          </div>
          <h2 className="text-2xl font-bold text-center dark:text-white mb-2">
            Registration Successful!
          </h2>
          <p className="text-center text-[#5A5A5A] dark:text-[#A8A8A8] mb-6">
            Your contractor account has been created. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#2D2D2D] py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-[#2D2D2D] rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold dark:text-white mb-2 text-center">
            Contractor Registration
          </h1>
          <p className="text-center text-[#5A5A5A] dark:text-[#A8A8A8] mb-6">
            Create your contractor account to access projects
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
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
                className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-white placeholder-[#8A8A8A] dark:placeholder-[#5A5A5A] disabled:opacity-50"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
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
                className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-white placeholder-[#8A8A8A] dark:placeholder-[#5A5A5A] disabled:opacity-50"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
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
                className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-white placeholder-[#8A8A8A] dark:placeholder-[#5A5A5A] disabled:opacity-50"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
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
                className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-white placeholder-[#8A8A8A] dark:placeholder-[#5A5A5A] disabled:opacity-50"
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
              <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
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
                className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-white placeholder-[#8A8A8A] dark:placeholder-[#5A5A5A] disabled:opacity-50"
              />
              <p className="text-xs text-[#5A5A5A] dark:text-[#A8A8A8] mt-1">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
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
                className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-brand-charcoal text-brand-charcoal dark:text-white placeholder-[#8A8A8A] dark:placeholder-[#5A5A5A] disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="border border-brand-error/30 bg-brand-error/10 dark:bg-brand-error/15 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-brand-error flex-shrink-0" />
                <p className="text-sm text-brand-error">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Login Link */}
            <p className="text-center text-[#5A5A5A] dark:text-[#A8A8A8] text-sm">
              Already have an account?{" "}
              <Link
                href="/contractor/login"
                className="text-brand-primary dark:text-brand-secondary hover:underline font-medium"
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
