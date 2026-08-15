"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, Plus, AlertCircle } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

interface Trade {
  id: string;
  name: string;
  description: string | null;
}

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTrades();
  }, []);

  async function fetchTrades() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/trades");
      if (!response.ok) {
        throw new Error("Failed to fetch trades");
      }

      const data = await response.json();
      setTrades(data.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTrade(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Trade name is required");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create trade");
      }

      setFormData({ name: "", description: "" });
      setShowForm(false);
      await fetchTrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                <Wrench className="h-8 w-8" />
                Trade Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage contractor specialties and project requirements
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Plus className="h-5 w-5" />
                New Trade
              </button>
            )}
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Trade
            </h2>
            <form onSubmit={handleCreateTrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trade Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Plumbing, Electrical"
                  disabled={submitting}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this trade..."
                  disabled={submitting}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium"
                >
                  {submitting ? "Creating..." : "Create Trade"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ name: "", description: "" });
                    setError(null);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Trades List */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Loading trades...
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No trades created yet
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create First Trade
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {trade.name}
                      </h3>
                      {trade.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {trade.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                      ID: {trade.id.substring(0, 8)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Total Trades:</strong> {trades.length}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
              Contractors can select from these trades when registering. Projects
              can be tagged with required trades to automatically match with
              qualified contractors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
