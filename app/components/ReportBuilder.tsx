"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  budgetSummary: {
    totalBudgeted: number;
    totalActual: number;
    remaining: number;
  };
  assetsBySystem: Record<string, any[]>;
  assetsByType: Record<string, any[]>;
  spaces: Record<string, { squareFootage: number; assets: any[] }>;
  tasks: any[];
  punchListBySpace: Record<string, any[]>;
  taskTimeline: any[];
}

export function ReportBuilder() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string>("summary");

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [budgetRes, assetsRes, spacesRes, tasksRes] = await Promise.all([
        fetch("/api/budget-items"),
        fetch("/api/assets"),
        fetch("/api/spaces"),
        fetch("/api/tasks"),
      ]);

      const budgetData = await budgetRes.json();
      const assetsData = await assetsRes.json();
      const spacesData = await spacesRes.json();
      const tasksData = await tasksRes.json();

      if (
        budgetData.success &&
        assetsData.success &&
        spacesData.success &&
        tasksData.success
      ) {
        // Build report
        const budgetItems = budgetData.data || [];
        const assets = assetsData.data || [];
        const spaces = spacesData.data || [];
        const tasks = tasksData.data || [];

        // Calculate budget summary
        const totalBudgeted = budgetItems.reduce(
          (sum: number, item: any) => sum + (item.budgetedAmount || 0),
          0
        );
        const totalActual = budgetItems.reduce(
          (sum: number, item: any) => sum + (item.actualAmount || 0),
          0
        );

        // Group assets by system
        const assetsBySystem: Record<string, any[]> = {};
        assets.forEach((asset: any) => {
          const systemName = asset.system?.name || "Unassigned";
          if (!assetsBySystem[systemName]) {
            assetsBySystem[systemName] = [];
          }
          assetsBySystem[systemName].push(asset);
        });

        // Group assets by type/category
        const assetsByType: Record<string, any[]> = {};
        const categories = [
          "Appliances",
          "Plumbing Fixtures",
          "Windows & Doors",
          "Flooring",
          "Stone/Countertops",
          "Lighting",
          "Hardware",
          "Other",
        ];

        categories.forEach((cat) => {
          assetsByType[cat] = assets.filter((a: any) =>
            a.name.toLowerCase().includes(cat.toLowerCase())
          );
        });

        // Build space data with sq footage
        const spaceMap: Record<string, any> = {};
        spaces.forEach((space: any) => {
          spaceMap[space.name] = {
            squareFootage: space.squareFootage || 0,
            assets: assets.filter((a: any) => a.spaceId === space.id),
          };
        });

        // Build punch list (incomplete tasks) grouped by space
        const punchListBySpace: Record<string, any[]> = {};
        const incompleteTasks = tasks.filter(
          (t: any) => t.status !== "completed"
        );
        incompleteTasks.forEach((task: any) => {
          const spaceName = task.space?.name || "Unassigned";
          if (!punchListBySpace[spaceName]) {
            punchListBySpace[spaceName] = [];
          }
          punchListBySpace[spaceName].push(task);
        });

        // Build task timeline sorted by due date
        const taskTimeline = [...tasks]
          .filter((t: any) => t.dueDate)
          .sort(
            (a: any, b: any) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );

        setReportData({
          budgetSummary: {
            totalBudgeted,
            totalActual,
            remaining: totalBudgeted - totalActual,
          },
          assetsBySystem,
          assetsByType,
          spaces: spaceMap,
          tasks,
          punchListBySpace,
          taskTimeline,
        });
      }
    } catch (error) {
      toast.error("Error", "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data", "Nothing to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            return typeof val === "string" && val.includes(",")
              ? `"${val}"`
              : val;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported", `${filename} downloaded`);
  };

  const downloadJSON = (data: any, filename: string) => {
    if (!data || Object.keys(data).length === 0) {
      toast.error("No data", "Nothing to export");
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("Exported", `${filename} downloaded`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-slate-800">
        <p className="text-gray-600 dark:text-gray-300">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: "summary", label: "Budget Summary" },
          { id: "systems", label: "By System" },
          { id: "categories", label: "By Category" },
          { id: "spaces", label: "By Space" },
          { id: "punchlist", label: "Punch List" },
          { id: "timeline", label: "Timeline" },
          { id: "takeoff", label: "Material Takeoff" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedReport(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              selectedReport === tab.id
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Budget Summary Report */}
      {selectedReport === "summary" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() =>
                downloadJSON(reportData.budgetSummary, "budget-summary")
              }
              className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-2 rounded border border-blue-300 dark:border-blue-700"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-900">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Budgeted
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(reportData.budgetSummary.totalBudgeted)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-900">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Actual Cost
              </p>
              <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(reportData.budgetSummary.totalActual)}
              </p>
            </div>
            <div
              className={`rounded-lg border p-6 ${
                reportData.budgetSummary.remaining >= 0
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
              }`}
            >
              <p
                className={`text-sm ${
                  reportData.budgetSummary.remaining >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                Remaining Budget
              </p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  reportData.budgetSummary.remaining >= 0
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {formatCurrency(reportData.budgetSummary.remaining)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-900">
            <h3 className="font-semibold mb-4 dark:text-white">
              Budget Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Budget Items:
                </span>
                <span className="font-medium dark:text-white">
                  {reportData.budgetSummary.totalBudgeted > 0
                    ? (
                        reportData.budgetSummary.totalActual /
                        reportData.budgetSummary.totalBudgeted
                      ).toFixed(1) + "%"
                    : "0%"}
                  spent
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* By System Report */}
      {selectedReport === "systems" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() =>
                downloadJSON(reportData.assetsBySystem, "assets-by-system")
              }
              className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-2 rounded border border-blue-300 dark:border-blue-700"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          {Object.entries(reportData.assetsBySystem).map(([system, assets]) => (
            <div
              key={system}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-900"
            >
              <h3 className="font-semibold mb-4 dark:text-white">
                {system} ({(assets as any[]).length} items)
              </h3>
              <div className="space-y-2 text-sm">
                {(assets as any[]).length > 0 ? (
                  (assets as any[]).map((asset) => (
                    <div
                      key={asset.id}
                      className="flex justify-between text-gray-600 dark:text-gray-400"
                    >
                      <span>
                        {asset.name}
                        {asset.manufacturer && ` - ${asset.manufacturer}`}
                      </span>
                      <span className="font-medium dark:text-white">
                        {asset.cost ? formatCurrency(asset.cost) : "—"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No assets in this system</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* By Category Report */}
      {selectedReport === "categories" && (
        <div className="space-y-4">
          {Object.entries(reportData.assetsByType)
            .filter(([, assets]) => (assets as any[]).length > 0)
            .map(([category, assets]) => (
              <div
                key={category}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-900"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold dark:text-white">
                    {category} ({(assets as any[]).length})
                  </h3>
                  <button
                    onClick={() =>
                      downloadCSV(
                        assets as any[],
                        category.replace(/\s+/g, "-")
                      )
                    }
                    className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {(assets as any[]).map((asset) => (
                    <div
                      key={asset.id}
                      className="flex justify-between text-gray-600 dark:text-gray-400"
                    >
                      <span>{asset.name}</span>
                      <span className="font-medium dark:text-white">
                        {asset.cost ? formatCurrency(asset.cost) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* By Space Report */}
      {selectedReport === "spaces" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() =>
                downloadJSON(reportData.spaces, "assets-by-space")
              }
              className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-2 rounded border border-blue-300 dark:border-blue-700"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          {Object.entries(reportData.spaces).map(([space, data]) => (
            <div
              key={space}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-900"
            >
              <h3 className="font-semibold mb-4 dark:text-white">
                {space}
                {data.squareFootage > 0 && (
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                    ({data.squareFootage.toLocaleString()} sq ft)
                  </span>
                )}
              </h3>
              <div className="space-y-2 text-sm">
                {data.assets.length > 0 ? (
                  data.assets.map((asset: any) => (
                    <div
                      key={asset.id}
                      className="flex justify-between text-gray-600 dark:text-gray-400"
                    >
                      <span>{asset.name}</span>
                      <span className="font-medium dark:text-white">
                        {asset.cost ? formatCurrency(asset.cost) : "—"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No assets in this space</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Punch List Report */}
      {selectedReport === "punchlist" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() =>
                downloadJSON(reportData.punchListBySpace, "punch-list")
              }
              className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-2 rounded border border-blue-300 dark:border-blue-700"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          {Object.keys(reportData.punchListBySpace).length > 0 ? (
            Object.entries(reportData.punchListBySpace).map(
              ([space, tasks]) => {
                const incompleteTasks = tasks.filter(
                  (t: any) => t.status !== "completed"
                );
                if (incompleteTasks.length === 0) return null;
                return (
                  <div
                    key={space}
                    className="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-900 dark:bg-orange-900/20"
                  >
                    <h3 className="font-semibold mb-4 text-orange-900 dark:text-orange-200">
                      {space} ({incompleteTasks.length} items)
                    </h3>
                    <div className="space-y-2 text-sm">
                      {incompleteTasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="flex items-start justify-between p-3 bg-white dark:bg-slate-800 rounded border border-orange-100 dark:border-orange-900"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            {task.status === "pending" && (
                              <AlertCircle className="h-4 w-4 mt-0.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            )}
                            {task.status === "in_progress" && (
                              <Clock className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </p>
                              {task.dueDate && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Due:{" "}
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ml-2 ${
                              task.status === "pending"
                                ? "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                : "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {task.status === "pending" ? "Pending" : "In Progress"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-900/20">
              <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 dark:text-green-400 mb-2" />
              <p className="text-green-800 dark:text-green-200 font-medium">
                All tasks complete! ✓
              </p>
            </div>
          )}
        </div>
      )}

      {/* Timeline Report */}
      {selectedReport === "timeline" && (
        <div className="space-y-4">
          {reportData.taskTimeline.length > 0 ? (
            <>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() =>
                    downloadJSON(reportData.taskTimeline, "task-timeline")
                  }
                  className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-2 rounded border border-blue-300 dark:border-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </button>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-900">
                <h3 className="font-semibold mb-4 dark:text-white">
                  Task Timeline ({reportData.taskTimeline.length})
                </h3>
              <div className="space-y-3">
                {reportData.taskTimeline.map((task: any, idx: number) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 pb-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                  >
                    <div className="flex-shrink-0 w-24">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      {task.space && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {task.space.name}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {task.status === "completed" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      {task.status === "in_progress" && (
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                      {task.status === "pending" && (
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-slate-800">
              <p className="text-gray-600 dark:text-gray-300">
                No scheduled tasks yet
              </p>
            </div>
          )}
        </div>
      )}

      {/* Material Takeoff Report */}
      {selectedReport === "takeoff" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() =>
                downloadJSON(reportData.assetsByType, "material-takeoff")
              }
              className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 px-3 py-2 rounded border border-blue-300 dark:border-blue-700"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Material Takeoff
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Plan uploads coming soon! Upload your floor plans and we'll automatically extract square footage, material quantities, and generate comprehensive takeoff schedules.
            </p>
            <div className="bg-white dark:bg-slate-900 rounded p-4 space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Planned features:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                <li>AI vision analysis of floor plans</li>
                <li>Automatic room square footage extraction</li>
                <li>Material quantity calculations</li>
                <li>Flooring, tile, stone, paint takeoff schedules</li>
                <li>Export to contractor specs</li>
              </ul>
            </div>
          </div>

          {/* Show current material categories for reference */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-slate-900">
            <h3 className="font-semibold mb-4 dark:text-white">
              Assets by Category (for manual takeoff)
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[
                "Flooring",
                "Stone/Countertops",
                "Windows & Doors",
                "Plumbing Fixtures",
                "Lighting",
              ].map((category) => {
                const catAssets = reportData.assetsByType[category] || [];
                if (catAssets.length === 0) return null;
                return (
                  <div key={category} className="border-t border-gray-100 dark:border-slate-700 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {category} ({catAssets.length})
                    </p>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 ml-3">
                      {catAssets.map((asset: any) => (
                        <div key={asset.id} className="flex justify-between">
                          <span>{asset.name}</span>
                          <span className="text-gray-500">
                            {asset.space?.name || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
