"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ContractManagement from "@/app/components/admin/ContractManagement";

type AdminTab = "contracts" | "bids" | "projects";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("contracts");

  return (
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
            Manage contracts, bids, and projects
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("contracts")}
              className={`flex-1 px-6 py-4 text-center font-medium transition ${
                activeTab === "contracts"
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              Contract Management
            </button>
            <button
              onClick={() => setActiveTab("bids")}
              className={`flex-1 px-6 py-4 text-center font-medium transition ${
                activeTab === "bids"
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              Bids
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex-1 px-6 py-4 text-center font-medium transition ${
                activeTab === "projects"
                  ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              }`}
            >
              Projects
            </button>
          </div>

          <div className="p-6">
            {activeTab === "contracts" && <ContractManagement />}

            {activeTab === "bids" && (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <p>Bid management coming soon</p>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                <p>Project management coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
