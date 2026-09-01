"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import Link from "next/link";

export default function ContractorLogin() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/contractor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to authenticate");
      }

      toast.success("Login successful", "Redirecting to dashboard...");

      setTimeout(() => {
        window.location.href = "/contractor";
      }, 1000);
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#2D2D2D] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#2D2D2D] rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold dark:text-white">
            🏗️ ResidenceOS
          </h1>
          <p className="text-[#5A5A5A] dark:text-[#A8A8A8] mt-2">
            Contractor Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contractor@company.com"
              className="mt-1 w-full rounded border border-[#D4D9CE] px-3 py-2 dark:border-[#1F1F1F] dark:bg-brand-charcoal dark:text-white"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium dark:text-white">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="mt-1 w-full rounded border border-[#D4D9CE] px-3 py-2 dark:border-[#1F1F1F] dark:bg-brand-charcoal dark:text-white"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-medium py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Login
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
          Don&apos;t have an account?{" "}
          <Link
            href="/contractor/register"
            className="text-brand-primary dark:text-brand-secondary font-medium hover:underline"
          >
            Sign up
          </Link>
        </div>

        {/* Back to Admin */}
        <div className="mt-4 text-center text-xs text-[#5A5A5A] dark:text-[#A8A8A8]">
          <Link
            href="/app/auth/login"
            className="hover:text-brand-charcoal dark:hover:text-white"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
