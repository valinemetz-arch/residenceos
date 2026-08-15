"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("vali@legacyandlandgroup.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.data.token);
        router.push("/app");
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setError("Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAF8] via-[#F5F3F0] to-[#E9C8B6] dark:from-[#2D2D2D] dark:via-[#1F1F1F] dark:to-[#142605] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A876] dark:bg-[#8B6F47] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2D5016] dark:bg-[#C9A876] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand Area */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 relative">
              <Image
                src="/nemetz-residence-logo.png"
                alt="Paseo de Caballo"
                width={96}
                height={96}
                priority
              />
            </div>
          </div>

          {/* Brand Name */}
          <div className="mb-6">
            <h1 className="font-[Georgia,Garamond,serif] text-5xl font-bold text-[#2D5016] dark:text-[#C9A876] tracking-tight leading-tight">
              Paseo de Caballo
            </h1>
            <p className="text-xs font-medium text-[#8B6F47] dark:text-[#A88860] uppercase tracking-widest mt-4 letter-spacing-wide">
              Property Management
            </p>
          </div>

          {/* Tagline */}
          <p className="text-[#5A5A5A] dark:text-[#A8A8A8] mt-3 text-sm leading-relaxed letter-spacing-wide">
            Elegant property management for the refined estate
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-xl shadow-md border border-[#D4D9CE] dark:border-[#2D2D2D] backdrop-blur-sm p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D5016] dark:text-[#C9A876] mb-3 letter-spacing-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-lg border border-[#D4D9CE] dark:border-[#2D2D2D] bg-[#FAFAF8] dark:bg-[#2D2D2D] text-[#1F1F1F] dark:text-[#FAFAF8] font-regular transition-all duration-200 focus:outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#2D5016]/30 dark:focus:border-[#C9A876] dark:focus:ring-[#C9A876]/30 placeholder-[#8A8A8A] dark:placeholder-[#5A5A5A]"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D5016] dark:text-[#C9A876] mb-3 letter-spacing-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-lg border border-[#D4D9CE] dark:border-[#2D2D2D] bg-[#FAFAF8] dark:bg-[#2D2D2D] text-[#1F1F1F] dark:text-[#FAFAF8] font-regular transition-all duration-200 focus:outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#2D5016]/30 dark:focus:border-[#C9A876] dark:focus:ring-[#C9A876]/30 placeholder-[#8A8A8A] dark:placeholder-[#5A5A5A]"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-[#8B3A3A]/10 dark:bg-[#8B3A3A]/20 border border-[#8B3A3A] text-[#8B3A3A] dark:text-[#E9A4A4] rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2D5016] hover:bg-[#1F3810] text-white font-semibold py-3 px-5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2 letter-spacing-wide"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Remember Me / Forgot Password */}
            <div className="flex items-center justify-between text-xs text-[#5A5A5A] dark:text-[#A8A8A8]">
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#2D5016] dark:hover:text-[#C9A876]">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <a
                href="#"
                className="hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </form>

          {/* Demo Info */}
          <div className="mt-8 pt-6 border-t border-[#D4D9CE] dark:border-[#2D2D2D]">
            <p className="text-xs text-center text-[#5A5A5A] dark:text-[#A8A8A8] letter-spacing-wide">
              Demo credentials pre-filled
            </p>
            <p className="text-xs text-center text-[#8A8A8A] dark:text-[#5A5A5A] mt-2 letter-spacing-wide">
              Click &quot;Sign In&quot; to continue
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-[#5A5A5A] dark:text-[#A8A8A8] mt-8">
          By signing in, you agree to our{" "}
          <a href="#" className="text-[#2D5016] dark:text-[#C9A876] hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-[#2D5016] dark:text-[#C9A876] hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}