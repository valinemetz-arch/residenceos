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
            className="flex items-center hover:opacity-80 transition-opacity group"
          >
            {/* Logo Image */}
            <div className="h-16 flex-shrink-0 relative group-hover:scale-105 transition-transform">
              <Image
                src="/nemetz-residence-logo.png"
                alt="Nemetz Residence - Paseo de Caballo"
                height={64}
                width={280}
                priority
                style={{ objectFit: "contain" }}
              />
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
