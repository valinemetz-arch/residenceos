"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#D4D9CE] dark:border-[#1F1F1F] bg-[#FAFAF8] dark:bg-[#2D2D2D] shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center gap-4 hover:opacity-80 transition-opacity group"
          >
            {/* Logo Image */}
            <div className="w-12 h-12 flex-shrink-0 relative group-hover:scale-105 transition-transform">
              <Image
                src="/paseo-logo.svg"
                alt="Paseo de Caballo"
                width={48}
                height={48}
                priority
              />
            </div>

            {/* Brand Text */}
            <div className="flex flex-col gap-0.5">
              <span className="font-[Georgia,Garamond,serif] text-lg font-bold text-[#2D5016] dark:text-[#C9A876] tracking-tight">
                Paseo
              </span>
              <span className="text-xs font-medium text-[#8B6F47] dark:text-[#A88860] uppercase tracking-widest letter-spacing-wide">
                de Caballo
              </span>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Header Actions (placeholder for future additions) */}
          <div className="flex items-center gap-6">
            {/* Additional header items can go here */}
          </div>
        </div>
      </div>
    </header>
  );
}
