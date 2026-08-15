"use client";

import { useEffect, useState } from "react";
import { FileText, DollarSign, Loader2, LogOut, Settings, FileCheck, ClipboardList } from "lucide-react";
import { toast } from "@/lib/toast";
import Link from "next/link";
import ContractorsContracts from "./ContractorsContracts";

interface Project {
  id: string;
  name: string;
  address: string;
  budget: number;
}

interface Bid {
  id: string;
  projectId: string;
  amount: number;
  status: string;
  submittedAt: string;
  project: Project;
}

interface ContractorTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  notes: string | null;
  space: { id: string; name: string } | null;
  system: { id: string; name: string } | null;
}

interface ContractorDashboardProps {
  contractor: {
    id: string;
    email: string;
    companyName: string;
  };
}

export default function ContractorDashboard({ contractor }: ContractorDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [tasks, setTasks] = useState<ContractorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "bids" | "contracts" | "tasks">("projects");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, bidsRes, tasksRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/bids/my-bids"),
        fetch("/api/contractor/tasks"),
      ]);

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.data || []);
      }

      if (bidsRes.ok) {
        const data = await bidsRes.json();
        setBids(data.data || []);
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      toast.error("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/contractor/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update task");
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
      toast.success("Task updated", "Status saved");
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to update task"
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/contractor/login";
    } catch (error) {
      toast.error("Error", "Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">
            Welcome, {contractor.companyName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {contractor.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/contractor/profile"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Settings className="h-4 w-4" />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active Projects
          </p>
          <p className="text-3xl font-bold dark:text-white mt-2">
            {projects.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your Bids
          </p>
          <p className="text-3xl font-bold dark:text-white mt-2">
            {bids.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Pending Review
          </p>
          <p className="text-3xl font-bold dark:text-white mt-2">
            {bids.filter((b) => b.status === "pending").length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Assigned Tasks
          </p>
          <p className="text-3xl font-bold dark:text-white mt-2">
            {tasks.filter((t) => t.status !== "completed").length}
          </p>
        </div>
      </div>

      {/* Projects Available for Bidding */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-xl font-bold dark:text-white mb-4">
          Available Projects
        </h2>
        {projects.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No projects available at this time.
          </p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/contractor/projects/${project.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold dark:text-white">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {project.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-semibold">
                      ${project.budget?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex-1 px-6 py-4 text-center font-medium transition ${
              activeTab === "projects"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            Available Projects
          </button>
          <button
            onClick={() => setActiveTab("bids")}
            className={`flex-1 px-6 py-4 text-center font-medium transition ${
              activeTab === "bids"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            Your Bids
          </button>
          <button
            onClick={() => setActiveTab("contracts")}
            className={`flex-1 px-6 py-4 text-center font-medium transition ${
              activeTab === "contracts"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            Contracts
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 px-6 py-4 text-center font-medium transition ${
              activeTab === "tasks"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            My Tasks
          </button>
        </div>

        <div className="p-6">
          {/* Projects Tab */}
          {activeTab === "projects" && (
            <>
              {projects.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No projects available at this time.
                </p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/contractor/projects/${project.id}`}
                      className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold dark:text-white">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {project.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">
                            ${project.budget?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Bids Tab */}
          {activeTab === "bids" && (
            <>
              {bids.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  You haven't submitted any bids yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">
                          Project
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold dark:text-gray-300">
                          Bid Amount
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">
                          Submitted
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((bid) => (
                        <tr
                          key={bid.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/contractor/projects/${bid.projectId}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              {bid.project?.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold dark:text-white">
                            ${bid.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                bid.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                  : bid.status === "approved"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              }`}
                            >
                              {bid.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(bid.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Contracts Tab */}
          {activeTab === "contracts" && (
            <ContractorsContracts contractorId={contractor.id} />
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <>
              {tasks.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No tasks have been assigned to you yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <h3
                            className={`font-semibold ${
                              task.status === "completed"
                                ? "line-through text-gray-500 dark:text-gray-400"
                                : "dark:text-white"
                            }`}
                          >
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {task.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300">
                            {task.space && <span>📍 {task.space.name}</span>}
                            {task.dueDate && (
                              <span>
                                📅 {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                task.priority === "critical" || task.priority === "high"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                  : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <select
                          value={task.status}
                          disabled={updatingTaskId === task.id}
                          onChange={(e) =>
                            handleTaskStatusChange(task.id, e.target.value)
                          }
                          className="shrink-0 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legacy Sections - Hidden but kept for backward compatibility */}
      <div className="hidden">
        {/* Your Bids */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold dark:text-white mb-4">Your Bids</h2>
        {bids.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            You haven't submitted any bids yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">
                    Project
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold dark:text-gray-300">
                    Bid Amount
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr
                    key={bid.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/contractor/projects/${bid.projectId}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {bid.project?.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold dark:text-white">
                      ${bid.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bid.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                            : bid.status === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        }`}
                      >
                        {bid.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(bid.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
