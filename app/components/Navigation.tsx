"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/app" className="font-bold text-xl flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🏠</span>
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">ResidenceOS</span>
            </Link>

            <div className="hidden md:flex space-x-1">
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

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button className="text-sm px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium text-gray-700 dark:text-gray-300">
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
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </Link>
  );
}