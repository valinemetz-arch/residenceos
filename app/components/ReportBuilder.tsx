"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Download, AlertCircle, CheckCircle2, Clock, Upload } from "lucide-react";
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

const REPORT_TABS = [
  { id: "summary", label: "Budget Summary" },
  { id: "systems", label: "By System" },
  { id: "categories", label: "By Category" },
  { id: "spaces", label: "By Space" },
  { id: "punchlist", label: "Punch List" },
  { id: "timeline", label: "Timeline" },
  { id: "takeoff", label: "Material Takeoff" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};
const STATUS_CLASS: Record<string, string> = {
  pending: "tag tag-outline",
  in_progress: "tag tag-accent",
  blocked: "tag tag-accent",
  completed: "tag tag-neutral",
};

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
      <div className="card" style={{ textAlign: "center", padding: 32 }}>
        <p className="card-meta">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Tabs */}
      <div>
        <div className="flex gap-2 flex-wrap no-print">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className="btn"
              style={
                selectedReport === tab.id
                  ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="hr" style={{ marginTop: 14 }} />
      </div>

      {/* Budget Summary Report */}
      {selectedReport === "summary" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() =>
                downloadJSON(reportData.budgetSummary, "budget-summary")
              }
              className="btn"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card" style={{ padding: "18px 20px" }}>
              <div className="card-kicker">Total Budgeted</div>
              <div className="card-title" style={{ fontSize: 28, marginTop: 4 }}>
                {formatCurrency(reportData.budgetSummary.totalBudgeted)}
              </div>
            </div>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div className="card-kicker">Total Actual Cost</div>
              <div className="card-title" style={{ fontSize: 28, marginTop: 4 }}>
                {formatCurrency(reportData.budgetSummary.totalActual)}
              </div>
            </div>
            <div className="card" style={{ padding: "18px 20px" }}>
              <div className="card-kicker">
                {reportData.budgetSummary.remaining >= 0 ? "Remaining Budget" : "Over Budget"}
              </div>
              <div className="card-title" style={{ fontSize: 28, marginTop: 4 }}>
                {formatCurrency(Math.abs(reportData.budgetSummary.remaining))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Budget Breakdown</h3>
            <div className="flex justify-between" style={{ fontSize: 14 }}>
              <span className="card-meta">Total Budget Items:</span>
              <span style={{ fontWeight: 600 }}>
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
      )}

      {/* By System Report */}
      {selectedReport === "systems" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() =>
                downloadJSON(reportData.assetsBySystem, "assets-by-system")
              }
              className="btn"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          {Object.entries(reportData.assetsBySystem).map(([system, assets]) => (
            <div key={system} className="card">
              <h3 style={{ marginBottom: 16 }}>
                {system} ({(assets as any[]).length} items)
              </h3>
              {(assets as any[]).length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Manufacturer</th>
                      <th style={{ textAlign: "right" }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assets as any[]).map((asset) => (
                      <tr key={asset.id}>
                        <td>{asset.name}</td>
                        <td>{asset.manufacturer || "—"}</td>
                        <td style={{ textAlign: "right" }}>
                          {asset.cost ? formatCurrency(asset.cost) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="card-meta">No assets in this system</p>
              )}
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
              <div key={category} className="card">
                <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                  <h3>
                    {category} ({(assets as any[]).length})
                  </h3>
                  <button
                    onClick={() =>
                      downloadCSV(
                        assets as any[],
                        category.replace(/\s+/g, "-")
                      )
                    }
                    className="btn btn-icon"
                    aria-label={`Export ${category}`}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: "right" }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assets as any[]).map((asset) => (
                      <tr key={asset.id}>
                        <td>{asset.name}</td>
                        <td style={{ textAlign: "right" }}>
                          {asset.cost ? formatCurrency(asset.cost) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      )}

      {/* By Space Report */}
      {selectedReport === "spaces" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() =>
                downloadJSON(reportData.spaces, "assets-by-space")
              }
              className="btn"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          {Object.entries(reportData.spaces).map(([space, data]) => (
            <div key={space} className="card">
              <h3 style={{ marginBottom: 16 }}>
                {space}
                {data.squareFootage > 0 && (
                  <span className="card-meta" style={{ fontWeight: 400, marginLeft: 8 }}>
                    ({data.squareFootage.toLocaleString()} sq ft)
                  </span>
                )}
              </h3>
              {data.assets.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: "right" }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assets.map((asset: any) => (
                      <tr key={asset.id}>
                        <td>{asset.name}</td>
                        <td style={{ textAlign: "right" }}>
                          {asset.cost ? formatCurrency(asset.cost) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="card-meta">No assets in this space</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Punch List Report */}
      {selectedReport === "punchlist" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() =>
                downloadJSON(reportData.punchListBySpace, "punch-list")
              }
              className="btn"
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
                  <div key={space} className="card">
                    <h3 style={{ marginBottom: 16 }}>
                      {space}{" "}
                      <span className="tag tag-accent" style={{ marginLeft: 6 }}>
                        {incompleteTasks.length} items
                      </span>
                    </h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Task</th>
                          <th>Due</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incompleteTasks.map((task: any) => (
                          <tr key={task.id}>
                            <td>
                              <div className="flex items-start gap-2">
                                {task.status === "pending" && (
                                  <AlertCircle className="h-4 w-4 mt-0.5" style={{ flexShrink: 0, color: "var(--color-accent-700)" }} />
                                )}
                                {task.status === "in_progress" && (
                                  <Clock className="h-4 w-4 mt-0.5" style={{ flexShrink: 0, color: "var(--color-accent-700)" }} />
                                )}
                                <span>{task.title}</span>
                              </div>
                            </td>
                            <td>
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : "—"}
                            </td>
                            <td>
                              <span className={STATUS_CLASS[task.status] || "tag tag-outline"}>
                                {STATUS_LABEL[task.status] || task.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
            )
          ) : (
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <CheckCircle2 className="h-8 w-8" style={{ margin: "0 auto 8px", color: "var(--color-accent-700)" }} />
              <p style={{ fontWeight: 600 }}>All tasks complete!</p>
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
                  className="btn"
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </button>
              </div>
              <div className="card">
                <h3 style={{ marginBottom: 16 }}>
                  Task Timeline ({reportData.taskTimeline.length})
                </h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Due</th>
                      <th>Task</th>
                      <th>Space</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.taskTimeline.map((task: any) => (
                      <tr key={task.id}>
                        <td>
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td>{task.title}</td>
                        <td>{task.space?.name || "—"}</td>
                        <td>
                          <span className={STATUS_CLASS[task.status] || "tag tag-outline"}>
                            {STATUS_LABEL[task.status] || task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <p className="card-meta">No scheduled tasks yet</p>
            </div>
          )}
        </div>
      )}

      {/* Material Takeoff Report */}
      {selectedReport === "takeoff" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() =>
                downloadJSON(reportData.assetsByType, "material-takeoff")
              }
              className="btn"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 8 }}>Material Takeoff from Floor Plans</h3>
            <p className="card-meta" style={{ marginBottom: 16 }}>
              Upload a plan set PDF and AI extracts countable/labeled takeoff items (door schedule, window schedule, appliances, fixtures, etc) per trade, flagging anything it can&apos;t confidently determine for you to confirm before it goes out to bid.
            </p>
            <Link href="/app/takeoffs" className="btn btn-primary" style={{ display: "inline-flex", width: "fit-content" }}>
              <Upload className="h-4 w-4" />
              Upload Floor Plan
            </Link>
          </div>

          {/* Show current material categories for reference */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Assets by Category (for manual takeoff)</h3>
            <div className="space-y-4" style={{ maxHeight: 384, overflowY: "auto" }}>
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
                  <div
                    key={category}
                    style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 12 }}
                    className="first:border-t-0 first:pt-0"
                  >
                    <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                      {category} ({catAssets.length})
                    </p>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Space</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catAssets.map((asset: any) => (
                          <tr key={asset.id}>
                            <td>{asset.name}</td>
                            <td>{asset.space?.name || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
