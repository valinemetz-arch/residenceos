"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { toast } from "@/lib/toast";

interface GapItem {
  type: "door" | "window";
  room: string;
  description: string;
  specified: number;
  created: number;
}

interface GapAnalysisData {
  summary: {
    totalDoorsSpecified: number;
    totalDoorsCreated: number;
    totalWindowsSpecified: number;
    totalWindowsCreated: number;
    completionPercentage: number;
  };
  items: GapItem[];
  roomBreakdown: Record<string, {
    doorsSpecified: number;
    doorsCreated: number;
    windowsSpecified: number;
    windowsCreated: number;
  }>;
}

interface GapAnalysisTabProps {
  projectId: string;
  onClose: () => void;
  onTabChange: (tab: string) => void;
}

export function GapAnalysisTab({
  projectId,
  onClose,
  onTabChange,
}: GapAnalysisTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GapAnalysisData | null>(null);
  const [viewMode, setViewMode] = useState<"summary" | "checklist">("summary");

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(
          `/api/analysis/missing-items?projectId=${projectId}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch gap analysis");
        }

        setData(result.data || null);
      } catch (error) {
        toast.error(
          "Analysis failed",
          error instanceof Error ? error.message : "Failed to load gap analysis"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [projectId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white p-8 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <p className="text-lg font-medium dark:text-white">
              Loading gap analysis...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="rounded-lg bg-white p-6 dark:bg-slate-900 max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold dark:text-white">Gap Analysis</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            No project data available for gap analysis.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">
            Gap Analysis Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode("summary")}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === "summary"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode("checklist")}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === "checklist"
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Detailed Checklist
          </button>
        </div>

        {/* Summary View */}
        {viewMode === "summary" && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="rounded-lg bg-gray-50 p-6 dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-white">
                  Overall Completion
                </h3>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.summary.completionPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${data.summary.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Doors Card */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800">
                <h4 className="mb-4 font-semibold dark:text-white">Doors</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Specified
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {data.summary.totalDoorsSpecified}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created/Installed
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {data.summary.totalDoorsCreated}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Remaining
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {data.summary.totalDoorsSpecified - data.summary.totalDoorsCreated}
                    </p>
                  </div>
                </div>
              </div>

              {/* Windows Card */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800">
                <h4 className="mb-4 font-semibold dark:text-white">Windows</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Specified
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {data.summary.totalWindowsSpecified}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created/Installed
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {data.summary.totalWindowsCreated}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Remaining
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {data.summary.totalWindowsSpecified - data.summary.totalWindowsCreated}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Breakdown */}
            {Object.keys(data.roomBreakdown).length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-800">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <h4 className="font-semibold dark:text-white">By Room</h4>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(data.roomBreakdown).map(([room, stats]) => (
                    <div key={room} className="px-6 py-4">
                      <h5 className="mb-3 font-medium dark:text-white">{room}</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Doors: {stats.doorsCreated} / {stats.doorsSpecified}
                          </p>
                          <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${
                                  stats.doorsSpecified > 0
                                    ? (stats.doorsCreated / stats.doorsSpecified) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Windows: {stats.windowsCreated} / {stats.windowsSpecified}
                          </p>
                          <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${
                                  stats.windowsSpecified > 0
                                    ? (stats.windowsCreated / stats.windowsSpecified) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checklist View */}
        {viewMode === "checklist" && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {data.items.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                All scheduled items have been created!
              </p>
            ) : (
              data.items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold uppercase text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {item.type}
                        </span>
                        <h4 className="font-semibold dark:text-white">
                          {item.room}
                        </h4>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </p>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className="dark:text-gray-300">
                          Specified: <strong>{item.specified}</strong>
                        </span>
                        <span className="dark:text-gray-300">
                          Created: <strong className="text-green-600 dark:text-green-400">{item.created}</strong>
                        </span>
                        <span className="dark:text-gray-300">
                          Missing: <strong className="text-orange-600 dark:text-orange-400">{Math.max(0, item.specified - item.created)}</strong>
                        </span>
                      </div>
                    </div>
                    {item.created < item.specified && (
                      <button className="ml-4 mt-1 rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 flex items-center gap-1 dark:bg-blue-600 dark:hover:bg-blue-700">
                        <Plus className="h-3 w-3" />
                        Create
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex gap-2 border-t border-gray-200 pt-6 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 rounded border border-gray-300 px-4 py-2 font-medium dark:border-gray-600 dark:text-gray-200"
          >
            Close
          </button>
          <button
            onClick={() => onTabChange("schedules")}
            className="flex-1 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
          >
            Extract More Schedules
          </button>
        </div>
      </div>
    </div>
  );
}
