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

const STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  estimated: "Estimated",
  "in-progress": "In Progress",
  completed: "Completed",
};
const STATUS_CLASS: Record<string, string> = {
  planning: "tag tag-outline",
  estimated: "tag tag-outline",
  "in-progress": "tag tag-accent",
  completed: "tag tag-neutral",
};

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="classical">
      {/* Add Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <Plus size={16} strokeWidth={1.8} />
          Add Budget Item
        </button>
      </div>

      {/* Summary Cards */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div className="card-title" style={{ fontSize: 28 }}>
              {formatCurrency(totalBudgeted)}
            </div>
            <div className="card-meta" style={{ marginTop: 4 }}>Total Budgeted</div>
          </div>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div className="card-title" style={{ fontSize: 28 }}>
              {formatCurrency(totalActual)}
            </div>
            <div className="card-meta" style={{ marginTop: 4 }}>Total Spent</div>
          </div>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              className="card-title"
              style={{ fontSize: 28, color: totalRemaining < 0 ? "var(--color-accent-700)" : undefined }}
            >
              {formatCurrency(totalRemaining)}
            </div>
            <div className="card-meta" style={{ marginTop: 4 }}>Remaining</div>
          </div>
        </div>
      )}

      {/* Budget Items Table */}
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p className="card-meta">No budget items yet. Create one to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={handleAddClick}>
            Create First Item
          </button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th style={{ textAlign: "right" }}>Budgeted</th>
              <th style={{ textAlign: "right" }}>Spent</th>
              <th style={{ textAlign: "right" }}>Remaining</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const remaining = (item.budgetedAmount || 0) - (item.actualAmount || 0);
              return (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.category}</td>
                  <td style={{ textAlign: "right" }}>
                    {item.budgetedAmount ? formatCurrency(item.budgetedAmount) : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {item.actualAmount ? formatCurrency(item.actualAmount) : "—"}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: remaining < 0 ? "var(--color-accent-700)" : undefined,
                    }}
                  >
                    {item.budgetedAmount && item.actualAmount ? formatCurrency(remaining) : "—"}
                  </td>
                  <td>
                    <span className={STATUS_CLASS[item.status] || "tag tag-outline"}>
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-icon"
                        onClick={() => {
                          setDetailItemId(item.id);
                          setShowDetail(true);
                        }}
                        aria-label="View files"
                      >
                        <FileText size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        className="btn btn-icon"
                        onClick={() => handleEditClick(item)}
                        aria-label="Edit budget item"
                      >
                        <Edit2 size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        className="btn btn-icon"
                        onClick={() => handleDeleteClick(item.id)}
                        disabled={deletingId === item.id}
                        aria-label="Delete budget item"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} strokeWidth={1.8} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    </div>
  );
}
