"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, FileText } from "lucide-react";
import { BudgetForm } from "./BudgetForm";
import { BudgetDetail } from "./BudgetDetail";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

interface Space {
  id: string;
  name: string;
}

import type { BudgetItemWithRelations } from "@/lib/types";

interface BudgetItem extends BudgetItemWithRelations {}

export function BudgetListWithForms() {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | undefined>();
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [parsedAmount, setParsedAmount] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, spacesRes] = await Promise.all([
        fetch("/api/budget-items"),
        fetch("/api/spaces"),
      ]);

      const itemsData = await itemsRes.json();
      const spacesData = await spacesRes.json();

      if (itemsData.success) setItems(itemsData.data);
      if (spacesData.success) setSpaces(spacesData.data);
    } catch (error) {
      toast.error("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClick = () => {
    setSelectedItem(undefined);
    setShowForm(true);
  };

  const handleEditClick = (item: BudgetItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleDeleteClick = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this budget item?")) {
      return;
    }

    setDeletingId(itemId);
    try {
      const response = await fetch(`/api/budget-items/${itemId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete item");
      }

      toast.success("Budget item deleted", "Item has been removed successfully");
      await loadData();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to delete item"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleAmountParsed = (amount: number) => {
    // Get the current item being viewed in the detail modal
    if (detailItemId) {
      const currentItem = items.find((i) => i.id === detailItemId);
      if (currentItem) {
        // Create a copy with the parsed amount
        setSelectedItem({
          ...currentItem,
          actualAmount: amount,
        });
        // Close detail modal and open form
        setShowDetail(false);
        setShowForm(true);
        setParsedAmount(amount);
      }
    }
  };

  const totalBudgeted = items.reduce((sum, item) => sum + (item.budgetedAmount || 0), 0);
  const totalActual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
  const totalRemaining = totalBudgeted - totalActual;

  const statusColors: Record<string, string> = {
    planning: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    estimated: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "in-progress":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold dark:text-white">Budget</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          Add Item
        </button>
      </div>

      {/* Summary Cards */}
      {items.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total Budgeted
            </p>
            <p className="mt-1 text-2xl font-bold dark:text-white">
              {formatCurrency(totalBudgeted)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total Spent
            </p>
            <p className="mt-1 text-2xl font-bold dark:text-white">
              {formatCurrency(totalActual)}
            </p>
          </div>
          <div
            className={`rounded-lg border p-4 ${
              totalRemaining >= 0
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
            }`}
          >
            <p
              className={`text-sm ${
                totalRemaining >= 0
                  ? "text-green-600 dark:text-green-300"
                  : "text-red-600 dark:text-red-300"
              }`}
            >
              Remaining
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${
                totalRemaining >= 0
                  ? "text-green-700 dark:text-green-200"
                  : "text-red-700 dark:text-red-200"
              }`}
            >
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>
      )}

      {/* Budget Items Table */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-slate-800">
          <p className="text-gray-600 dark:text-gray-300">
            No budget items yet. Create one to get started.
          </p>
          <button
            onClick={handleAddClick}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create First Item
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left font-semibold dark:text-gray-200">
                  Name
                </th>
                <th className="px-6 py-3 text-left font-semibold dark:text-gray-200">
                  Category
                </th>
                <th className="px-6 py-3 text-right font-semibold dark:text-gray-200">
                  Budgeted
                </th>
                <th className="px-6 py-3 text-right font-semibold dark:text-gray-200">
                  Spent
                </th>
                <th className="px-6 py-3 text-right font-semibold dark:text-gray-200">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left font-semibold dark:text-gray-200">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-semibold dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((item) => {
                const remaining =
                  (item.budgetedAmount || 0) - (item.actualAmount || 0);
                return (
                  <tr
                    key={item.id}
                    className="bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <td className="px-6 py-4 font-medium dark:text-white">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">
                      {item.budgetedAmount
                        ? formatCurrency(item.budgetedAmount)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">
                      {item.actualAmount
                        ? formatCurrency(item.actualAmount)
                        : "—"}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-semibold ${
                        remaining >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {item.budgetedAmount && item.actualAmount
                        ? formatCurrency(remaining)
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                          statusColors[item.status] || statusColors.planning
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setDetailItemId(item.id);
                            setShowDetail(true);
                          }}
                          className="rounded border border-blue-300 p-2 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
                        >
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="rounded border border-gray-300 p-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded border border-red-300 p-2 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:hover:bg-red-900/20"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <BudgetForm
          item={selectedItem}
          spaces={spaces}
          onClose={() => {
            setShowForm(false);
            setSelectedItem(undefined);
          }}
          onSuccess={loadData}
        />
      )}

      {/* Detail Modal */}
      {showDetail && detailItemId && (
        <BudgetDetail
          budgetItemId={detailItemId}
          budgetName={
            items.find((i) => i.id === detailItemId)?.description ||
            "Budget Item"
          }
          onClose={() => {
            setShowDetail(false);
            setDetailItemId(null);
            loadData();
          }}
          onAmountParsed={handleAmountParsed}
        />
      )}
    </>
  );
}
