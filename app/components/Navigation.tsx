"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/app" className="font-bold text-xl">
              🏠 ResidenceOS
            </Link>

            <div className="hidden md:flex space-x-4">
              <NavLink href="/app" isActive={isActive("/app") && pathname === "/app"}>
                Dashboard
              </NavLink>
              <NavLink href="/app/spaces" isActive={isActive("/app/spaces")}>
                Spaces
              </NavLink>
              <NavLink href="/app/assets" isActive={isActive("/app/assets")}>
                Assets
              </NavLink>
              <NavLink href="/app/systems" isActive={isActive("/app/systems")}>
                Systems
              </NavLink>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="text-sm px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800">
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
      className={`text-sm font-medium transition-colors ${
        isActive
          ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-4"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
      }`}
    >
      {children}
    </Link>
  );
}