"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, FileText, AlertCircle } from "lucide-react";
import { WarrantyForm } from "./WarrantyForm";
import { toast } from "@/lib/toast";

interface Asset {
  id: string;
  name: string;
}

interface Space {
  id: string;
  name: string;
}

interface Warranty {
  [key: string]: unknown;
  id: string;
  title: string;
  description: string | null;
  coverageScope: string | null;
  startDate: string;
  endDate: string;
  months: number | null;
  assetId: string | null;
  spaceId: string | null;
  provider: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  claimProcess: string | null;
  serialNumber: string | null;
  status: string;
  createdAt: string;
}

export function WarrantyListWithForms() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [warrantiesRes, assetsRes, spacesRes] = await Promise.all([
        fetch("/api/warranties"),
        fetch("/api/assets"),
        fetch("/api/spaces"),
      ]);

      const warrantiesData = await warrantiesRes.json();
      const assetsData = await assetsRes.json();
      const spacesData = await spacesRes.json();

      if (warrantiesData.success) setWarranties(warrantiesData.data);
      if (assetsData.success) setAssets(assetsData.data);
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
    setSelectedWarranty(undefined);
    setShowForm(true);
  };

  const handleEditClick = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
    setShowForm(true);
  };

  const handleDeleteClick = async (warrantyId: string) => {
    if (!confirm("Are you sure you want to delete this warranty?")) {
      return;
    }

    setDeletingId(warrantyId);
    try {
      const response = await fetch(`/api/warranties/${warrantyId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete warranty");
      }

      toast.success("Warranty deleted", "Warranty has been removed successfully");
      await loadData();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to delete warranty"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "claimed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "voided":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const getExpiringWarranties = () => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return warranties.filter(
      (w) =>
        new Date(w.endDate) < thirtyDaysFromNow &&
        new Date(w.endDate) >= new Date()
    );
  };

  const expiring = getExpiringWarranties();

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
        <h1 className="text-3xl font-bold dark:text-white">Warranties</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          Add Warranty
        </button>
      </div>

      {/* Expiring Soon Alert */}
      {expiring.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                {expiring.length} Warrant{expiring.length === 1 ? "y" : "ies"} Expiring Soon
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                {expiring.map((w) => w.title).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warranties List */}
      {warranties.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-slate-800">
          <p className="text-gray-600 dark:text-gray-300">
            No warranties recorded yet. Add one to get started.
          </p>
          <button
            onClick={handleAddClick}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Add First Warranty
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {warranties.map((warranty) => {
            const expired = isExpired(warranty.endDate);
            return (
              <div
                key={warranty.id}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold dark:text-white">
                        {warranty.title}
                      </h3>
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusColor(
                          warranty.status
                        )}`}
                      >
                        {warranty.status}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Expires: <span className="font-medium dark:text-white">
                            {new Date(warranty.endDate).toLocaleDateString()}
                          </span>
                          {expired && (
                            <span className="ml-2 text-red-600 dark:text-red-400">
                              (Expired)
                            </span>
                          )}
                        </p>
                      </div>
                      {warranty.provider && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Provider: <span className="font-medium dark:text-white">
                              {warranty.provider}
                            </span>
                          </p>
                        </div>
                      )}
                      {warranty.coverageScope && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Coverage: <span className="font-medium dark:text-white">
                              {warranty.coverageScope}
                            </span>
                          </p>
                        </div>
                      )}
                      {warranty.phone && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Phone: <span className="font-medium dark:text-white">
                              {warranty.phone}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {warranty.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {warranty.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditClick(warranty)}
                      className="rounded border border-gray-300 p-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(warranty.id)}
                      disabled={deletingId === warranty.id}
                      className="rounded border border-red-300 p-2 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:hover:bg-red-900/20"
                    >
                      {deletingId === warranty.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <WarrantyForm
          warranty={selectedWarranty}
          assets={assets}
          spaces={spaces}
          onClose={() => {
            setShowForm(false);
            setSelectedWarranty(undefined);
          }}
          onSuccess={loadData}
        />
      )}
    </>
  );
}
