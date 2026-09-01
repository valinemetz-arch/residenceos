"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, Plus, AlertCircle } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { RequireAdmin } from "@/app/components/admin/RequireAdmin";

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

      const response = await authFetch("/api/trades", {
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
    <RequireAdmin>
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#2D2D2D]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="flex items-center gap-2 text-brand-primary dark:text-brand-secondary hover:underline mb-4"
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
              <p className="text-[#5A5A5A] dark:text-[#A8A8A8] mt-2">
                Manage contractor specialties and project requirements
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg font-medium"
              >
                <Plus className="h-5 w-5" />
                New Trade
              </button>
            )}
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] p-6 mb-6">
            <h2 className="text-lg font-semibold text-brand-charcoal dark:text-white mb-4">
              Create New Trade
            </h2>
            <form onSubmit={handleCreateTrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
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
                  className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white placeholder-[#5A5A5A] dark:placeholder-[#A8A8A8] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
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
                  className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white placeholder-[#5A5A5A] dark:placeholder-[#A8A8A8] disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="bg-brand-error/10 dark:bg-brand-error/25 border border-brand-error/30 dark:border-brand-error/40 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-brand-error flex-shrink-0" />
                  <p className="text-sm text-brand-error">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:bg-brand-gray text-white rounded-lg font-medium"
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
                  className="px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] text-[#5A5A5A] dark:text-[#A8A8A8] rounded-lg hover:bg-brand-cream dark:hover:bg-brand-charcoal disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Trades List */}
        <div className="bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F]">
          {loading ? (
            <div className="text-center py-12 text-[#5A5A5A] dark:text-[#A8A8A8]">
              Loading trades...
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-[#D4D9CE] dark:text-[#1F1F1F] mx-auto mb-4" />
              <p className="text-[#5A5A5A] dark:text-[#A8A8A8] mb-4">
                No trades created yet
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg font-medium"
                >
                  Create First Trade
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#D4D9CE] dark:divide-[#1F1F1F]">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="p-6 hover:bg-brand-cream dark:hover:bg-brand-charcoal transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-brand-charcoal dark:text-white">
                        {trade.name}
                      </h3>
                      {trade.description && (
                        <p className="text-[#5A5A5A] dark:text-[#A8A8A8] mt-1">
                          {trade.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-[#5A5A5A] dark:text-[#A8A8A8] bg-brand-cream dark:bg-brand-charcoal px-3 py-1 rounded-full">
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
          <div className="border-brand-info/30 bg-brand-info/10 dark:bg-brand-info/15 border rounded-lg p-4">
            <p className="text-sm text-brand-info">
              <strong>Total Trades:</strong> {trades.length}
            </p>
            <p className="text-xs text-brand-info mt-2">
              Contractors can select from these trades when registering. Projects
              can be tagged with required trades to automatically match with
              qualified contractors.
            </p>
          </div>
        </div>
      </div>
    </div>
    </RequireAdmin>
  );
}
