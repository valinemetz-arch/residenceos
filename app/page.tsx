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
        localStorage.setItem("user", JSON.stringify(data.data.user));
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background photograph */}
      <Image
        src="/images/paseo-hero.jpg"
        alt="Paseo de Caballo at dusk"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover" }}
        className="brightness-[0.55]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Login Form Card */}
        <div className="bg-[#FAFAF8]/97 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-10">
          {/* Logo */}
          <div className="flex justify-center mb-2 -mt-2">
            <div className="w-full max-w-[280px] relative aspect-[1536/1024]">
              <Image
                src="/nemetz-residence-logo.png"
                alt="Nemetz Residence - Paseo de Caballo"
                fill
                sizes="280px"
                priority
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
          <p className="text-center text-xs font-medium text-[#8B6F47] uppercase tracking-widest mb-8 letter-spacing-wide">
            Property Management
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D5016] mb-3 letter-spacing-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-lg border border-[#D4D9CE] bg-[#FAFAF8] text-[#1F1F1F] font-regular transition-all duration-200 focus:outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#2D5016]/30 placeholder-[#8A8A8A]"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D5016] mb-3 letter-spacing-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 rounded-lg border border-[#D4D9CE] bg-[#FAFAF8] text-[#1F1F1F] font-regular transition-all duration-200 focus:outline-none focus:border-[#2D5016] focus:ring-2 focus:ring-[#2D5016]/30 placeholder-[#8A8A8A]"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-[#8B3A3A]/10 border border-[#8B3A3A] text-[#8B3A3A] rounded-lg text-sm font-medium">
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
            <div className="flex items-center justify-between text-xs text-[#5A5A5A]">
              <label className="flex items-center gap-2 cursor-pointer hover:text-[#2D5016]">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <a href="#" className="hover:text-[#2D5016] transition-colors">
                Forgot password?
              </a>
            </div>
          </form>

          {/* Demo Info */}
          <div className="mt-8 pt-6 border-t border-[#D4D9CE]">
            <p className="text-xs text-center text-[#5A5A5A] letter-spacing-wide">
              Demo credentials pre-filled
            </p>
            <p className="text-xs text-center text-[#8A8A8A] mt-2 letter-spacing-wide">
              Click &quot;Sign In&quot; to continue
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-white/60 mt-8 drop-shadow-sm">
          By signing in, you agree to our{" "}
          <a href="#" className="text-white/90 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-white/90 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
