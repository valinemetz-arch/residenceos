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
        <div className="rounded-lg bg-white p-8 dark:bg-[#2D2D2D]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
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
        <div className="rounded-lg bg-white p-6 dark:bg-[#2D2D2D] max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold dark:text-white">Gap Analysis</h2>
            <button
              onClick={onClose}
              className="text-[#5A5A5A] hover:text-[#1F1F1F] dark:text-[#A8A8A8] dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-[#5A5A5A] dark:text-[#A8A8A8]">
            No project data available for gap analysis.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-primary-dark"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#2D2D2D]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">
            Gap Analysis Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-[#5A5A5A] hover:text-[#1F1F1F] dark:text-[#A8A8A8] dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-2 border-b border-[#D4D9CE] dark:border-[#1F1F1F]">
          <button
            onClick={() => setViewMode("summary")}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === "summary"
                ? "border-b-2 border-brand-primary text-brand-primary dark:text-brand-secondary"
                : "text-[#5A5A5A] hover:text-[#1F1F1F] dark:text-[#A8A8A8] dark:hover:text-white"
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setViewMode("checklist")}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === "checklist"
                ? "border-b-2 border-brand-primary text-brand-primary dark:text-brand-secondary"
                : "text-[#5A5A5A] hover:text-[#1F1F1F] dark:text-[#A8A8A8] dark:hover:text-white"
            }`}
          >
            Detailed Checklist
          </button>
        </div>

        {/* Summary View */}
        {viewMode === "summary" && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="rounded-lg bg-brand-cream p-6 dark:bg-brand-charcoal">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-white">
                  Overall Completion
                </h3>
                <span className="text-2xl font-bold text-brand-primary dark:text-brand-secondary">
                  {data.summary.completionPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#D4D9CE] dark:bg-[#1F1F1F] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-dark transition-all"
                  style={{ width: `${data.summary.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Doors Card */}
              <div className="rounded-lg border border-[#D4D9CE] bg-white p-4 dark:border-[#1F1F1F] dark:bg-[#2D2D2D]">
                <h4 className="mb-4 font-semibold dark:text-white">Doors</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                      Specified
                    </p>
                    <p className="text-3xl font-bold text-brand-primary dark:text-brand-secondary">
                      {data.summary.totalDoorsSpecified}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                      Created/Installed
                    </p>
                    <p className="text-3xl font-bold text-brand-success dark:text-brand-success">
                      {data.summary.totalDoorsCreated}
                    </p>
                  </div>
                  <div className="border-t border-[#D4D9CE] pt-3 dark:border-[#1F1F1F]">
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                      Remaining
                    </p>
                    <p className="text-2xl font-bold text-brand-warning dark:text-brand-warning">
                      {data.summary.totalDoorsSpecified - data.summary.totalDoorsCreated}
                    </p>
                  </div>
                </div>
              </div>

              {/* Windows Card */}
              <div className="rounded-lg border border-[#D4D9CE] bg-white p-4 dark:border-[#1F1F1F] dark:bg-[#2D2D2D]">
                <h4 className="mb-4 font-semibold dark:text-white">Windows</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                      Specified
                    </p>
                    <p className="text-3xl font-bold text-brand-primary dark:text-brand-secondary">
                      {data.summary.totalWindowsSpecified}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                      Created/Installed
                    </p>
                    <p className="text-3xl font-bold text-brand-success dark:text-brand-success">
                      {data.summary.totalWindowsCreated}
                    </p>
                  </div>
                  <div className="border-t border-[#D4D9CE] pt-3 dark:border-[#1F1F1F]">
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                      Remaining
                    </p>
                    <p className="text-2xl font-bold text-brand-warning dark:text-brand-warning">
                      {data.summary.totalWindowsSpecified - data.summary.totalWindowsCreated}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Breakdown */}
            {Object.keys(data.roomBreakdown).length > 0 && (
              <div className="rounded-lg border border-[#D4D9CE] bg-white dark:border-[#1F1F1F] dark:bg-[#2D2D2D]">
                <div className="border-b border-[#D4D9CE] px-6 py-4 dark:border-[#1F1F1F]">
                  <h4 className="font-semibold dark:text-white">By Room</h4>
                </div>
                <div className="divide-y divide-[#D4D9CE] dark:divide-[#1F1F1F]">
                  {Object.entries(data.roomBreakdown).map(([room, stats]) => (
                    <div key={room} className="px-6 py-4">
                      <h5 className="mb-3 font-medium dark:text-white">{room}</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#5A5A5A] dark:text-[#A8A8A8]">
                            Doors: {stats.doorsCreated} / {stats.doorsSpecified}
                          </p>
                          <div className="mt-1 h-2 w-full rounded-full bg-[#D4D9CE] dark:bg-[#1F1F1F] overflow-hidden">
                            <div
                              className="h-full bg-brand-primary"
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
                          <p className="text-xs text-[#5A5A5A] dark:text-[#A8A8A8]">
                            Windows: {stats.windowsCreated} / {stats.windowsSpecified}
                          </p>
                          <div className="mt-1 h-2 w-full rounded-full bg-[#D4D9CE] dark:bg-[#1F1F1F] overflow-hidden">
                            <div
                              className="h-full bg-brand-success"
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
              <p className="text-center text-[#5A5A5A] dark:text-[#A8A8A8] py-8">
                All scheduled items have been created!
              </p>
            ) : (
              data.items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded border border-[#D4D9CE] bg-brand-cream p-4 dark:border-[#1F1F1F] dark:bg-brand-charcoal"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded bg-brand-info/10 px-2 py-1 text-xs font-semibold uppercase text-brand-info dark:bg-brand-info/25 dark:text-brand-info">
                          {item.type}
                        </span>
                        <h4 className="font-semibold dark:text-white">
                          {item.room}
                        </h4>
                      </div>
                      <p className="mt-2 text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                        {item.description}
                      </p>
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className="dark:text-[#A8A8A8]">
                          Specified: <strong>{item.specified}</strong>
                        </span>
                        <span className="dark:text-[#A8A8A8]">
                          Created: <strong className="text-brand-success dark:text-brand-success">{item.created}</strong>
                        </span>
                        <span className="dark:text-[#A8A8A8]">
                          Missing: <strong className="text-brand-warning dark:text-brand-warning">{Math.max(0, item.specified - item.created)}</strong>
                        </span>
                      </div>
                    </div>
                    {item.created < item.specified && (
                      <button className="ml-4 mt-1 rounded bg-brand-primary px-3 py-1 text-sm font-medium text-white hover:bg-brand-primary-dark flex items-center gap-1 dark:bg-brand-primary dark:hover:bg-brand-primary-dark">
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
        <div className="mt-6 flex gap-2 border-t border-[#D4D9CE] pt-6 dark:border-[#1F1F1F]">
          <button
            onClick={onClose}
            className="flex-1 rounded border border-[#D4D9CE] px-4 py-2 font-medium dark:border-[#1F1F1F] dark:text-white"
          >
            Close
          </button>
          <button
            onClick={() => onTabChange("schedules")}
            className="flex-1 rounded bg-brand-primary px-4 py-2 font-medium text-white hover:bg-brand-primary-dark"
          >
            Extract More Schedules
          </button>
        </div>
      </div>
    </div>
  );
}
