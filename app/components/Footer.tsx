"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#D4D9CE] dark:border-[#1F1F1F] bg-[#F5F3F0] dark:bg-[#1F1F1F] text-[#1F1F1F] dark:text-[#FAFAF8] transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative">
                <Image
                  src="/paseo-logo.svg"
                  alt="Paseo de Caballo"
                  width={32}
                  height={32}
                />
              </div>
              <div>
                <div className="font-[Georgia,Garamond,serif] text-sm font-bold text-[#2D5016] dark:text-[#C9A876]">
                  Paseo
                </div>
                <div className="text-xs font-medium text-[#8B6F47] dark:text-[#A88860] uppercase letter-spacing-wide">
                  de Caballo
                </div>
              </div>
            </div>
            <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8] leading-relaxed letter-spacing-wide">
              Professional property management and digital twin technology for residential estates.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-[Georgia,Garamond,serif] text-sm font-bold text-[#2D5016] dark:text-[#C9A876] mb-5 uppercase letter-spacing-wide">
              Product
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/app"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/app/spaces"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Spaces
                </Link>
              </li>
              <li>
                <Link
                  href="/app/assets"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Assets
                </Link>
              </li>
              <li>
                <Link
                  href="/app/tasks"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Tasks
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-[Georgia,Garamond,serif] text-sm font-bold text-[#2D5016] dark:text-[#C9A876] mb-5 uppercase letter-spacing-wide">
              Resources
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-[Georgia,Garamond,serif] text-sm font-bold text-[#2D5016] dark:text-[#C9A876] mb-5 uppercase letter-spacing-wide">
              Company
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] transition-colors letter-spacing-wide"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#D4D9CE] dark:border-[#2D2D2D] mt-10" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-10">
          <p className="text-xs text-[#5A5A5A] dark:text-[#A8A8A8] mb-6 md:mb-0 letter-spacing-wide">
            &copy; {currentYear} Paseo de Caballo. All rights reserved.
          </p>

          {/* Social or additional links */}
          <div className="flex items-center gap-8">
            <a
              href="#"
              className="text-[#2D5016] dark:text-[#C9A876] hover:opacity-70 transition-opacity"
              aria-label="Twitter"
            >
              <span className="text-sm font-medium letter-spacing-wide">Twitter</span>
            </a>
            <a
              href="#"
              className="text-[#2D5016] dark:text-[#C9A876] hover:opacity-70 transition-opacity"
              aria-label="LinkedIn"
            >
              <span className="text-sm font-medium letter-spacing-wide">LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
