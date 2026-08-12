"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-40 border-b border-[#D4D9CE] dark:border-[#1F1F1F] bg-[#FAFAF8] dark:bg-[#2D2D2D] shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-10">
            {/* Logo and Brand */}
            <Link
              href="/app"
              className="font-bold text-lg flex items-center hover:opacity-80 transition-opacity group flex-shrink-0"
            >
              <div className="h-14 relative group-hover:scale-105 transition-transform">
                <Image
                  src="/nemetz-residence-logo.png"
                  alt="Nemetz Residence - Paseo de Caballo"
                  height={56}
                  width={220}
                  priority
                  style={{ objectFit: "contain" }}
                />
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden lg:flex space-x-2">
              <NavLink href="/app" isActive={isActive("/app") && pathname === "/app"}>
                Dashboard
              </NavLink>
              <NavLink href="/app/spaces" isActive={isActive("/app/spaces")}>
                Spaces
              </NavLink>
              <NavLink href="/app/assets" isActive={isActive("/app/assets")}>
                Assets
              </NavLink>
              <NavLink href="/app/tasks" isActive={isActive("/app/tasks")}>
                Tasks
              </NavLink>
              <NavLink href="/app/budget" isActive={isActive("/app/budget")}>
                Budget
              </NavLink>
              <NavLink href="/app/warranties" isActive={isActive("/app/warranties")}>
                Warranties
              </NavLink>
              <NavLink href="/app/systems" isActive={isActive("/app/systems")}>
                Systems
              </NavLink>
              <NavLink href="/app/reports" isActive={isActive("/app/reports")}>
                Reports
              </NavLink>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="text-sm px-5 py-2 rounded-lg hover:bg-[#F5F3F0] dark:hover:bg-[#1F1F1F] transition-colors font-medium text-[#2D5016] dark:text-[#C9A876] letter-spacing-wide">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
}

function NavLink({ href, children, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 letter-spacing-wide ${
        isActive
          ? "text-[#2D5016] dark:text-[#C9A876] bg-[#F5F3F0] dark:bg-[#1F1F1F] border-b-2 border-[#2D5016] dark:border-[#C9A876]"
          : "text-[#5A5A5A] dark:text-[#A8A8A8] hover:text-[#2D5016] dark:hover:text-[#C9A876] hover:bg-[#F5F3F0] dark:hover:bg-[#1F1F1F]"
      }`}
    >
      {children}
    </Link>
  );
}