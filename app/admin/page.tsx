"use client";

import Link from "next/link";
import { ArrowLeft, Users, Wrench, MapPin } from "lucide-react";
import { RequireAdmin } from "@/app/components/admin/RequireAdmin";

export default function AdminPage() {
  const adminTools = [
    {
      icon: Users,
      title: "User Management",
      description: "Manage administrators and viewers",
      href: "/admin/users",
      color: "bg-brand-info/10 dark:bg-brand-info/25 text-brand-info dark:text-brand-info",
    },
    {
      icon: Wrench,
      title: "Trades Management",
      description: "Manage contractor specialties",
      href: "/admin/trades",
      color:
        "bg-brand-secondary/15 dark:bg-brand-secondary/25 text-brand-accent dark:text-brand-secondary",
    },
    {
      icon: MapPin,
      title: "Site Info",
      description: "Gate code, phase, timeline & contacts",
      href: "/admin/site-info",
      color: "bg-brand-success/10 dark:bg-brand-success/25 text-brand-success dark:text-brand-success",
    },
  ];

  return (
    <RequireAdmin>
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#2D2D2D]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="flex items-center gap-2 text-brand-primary dark:text-brand-secondary hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold dark:text-white">Admin Center</h1>
          <p className="text-[#5A5A5A] dark:text-[#A8A8A8] mt-2">
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
                className="bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] p-6 hover:shadow-lg dark:hover:shadow-lg/20 transition"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${tool.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-brand-charcoal dark:text-white">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8] mt-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* System Info */}
        <div className="border-brand-info/30 bg-brand-info/10 dark:bg-brand-info/15 border rounded-lg p-6">
          <h3 className="font-semibold text-brand-info mb-2">
            Administrator Tools
          </h3>
          <p className="text-sm text-brand-info">
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
