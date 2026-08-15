"use client";

import Link from "next/link";
import { ArrowLeft, Users, Wrench } from "lucide-react";
import { RequireAdmin } from "@/app/components/admin/RequireAdmin";

export default function AdminPage() {
  const adminTools = [
    {
      icon: Users,
      title: "User Management",
      description: "Manage administrators and viewers",
      href: "/admin/users",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      icon: Wrench,
      title: "Trades Management",
      description: "Manage contractor specialties",
      href: "/admin/trades",
      color:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <RequireAdmin>
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold dark:text-white">Admin Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            System administration and management
          </p>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {adminTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-lg/20 transition"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${tool.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* System Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Administrator Tools
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-400">
            Use these tools to manage users, configure contractors, and monitor
            system activity. All actions are logged for security and compliance
            purposes.
          </p>
        </div>
      </div>
    </div>
    </RequireAdmin>
  );
}
