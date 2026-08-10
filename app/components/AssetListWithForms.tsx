"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, FileText } from "lucide-react";
import { AssetForm } from "./AssetForm";
import { AssetDetail } from "./AssetDetail";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

interface Space {
  id: string;
  name: string;
}

interface System {
  id: string;
  name: string;
}

import type { AssetWithRelations } from "@/lib/types";

interface Asset extends AssetWithRelations {}

export function AssetListWithForms() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>();
  const [detailAssetId, setDetailAssetId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsRes, spacesRes, systemsRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/spaces"),
        fetch("/api/systems"),
      ]);

      const assetsData = await assetsRes.json();
      const spacesData = await spacesRes.json();
      const systemsData = await systemsRes.json();

      if (assetsData.success) setAssets(assetsData.data);
      if (spacesData.success) setSpaces(spacesData.data);
      if (systemsData.success) setSystems(systemsData.data);
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
    setSelectedAsset(undefined);
    setShowForm(true);
  };

  const handleEditClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowForm(true);
  };

  const handleDeleteClick = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) {
      return;
    }

    setDeletingId(assetId);
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete asset");
      }

      toast.success("Asset deleted", "Asset has been removed successfully");
      await loadData();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to delete asset"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    ordered: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "in-stock":
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
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
        <h1 className="text-3xl font-bold dark:text-white">Assets</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          Add Asset
        </button>
      </div>

      {/* Assets Table */}
      {assets.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-slate-800">
          <p className="text-gray-600 dark:text-gray-300">
            No assets yet. Create one to get started.
          </p>
          <button
            onClick={handleAddClick}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Create First Asset
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
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left font-semibold dark:text-gray-200">
                  Location
                </th>
                <th className="px-6 py-3 text-left font-semibold dark:text-gray-200">
                  Cost
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
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <td className="px-6 py-4 font-medium dark:text-white">
                    {asset.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {asset.manufacturer || "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {asset.space.name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {asset.cost ? formatCurrency(asset.cost) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                        statusColors[asset.status] || statusColors.pending
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDetailAssetId(asset.id);
                          setShowDetail(true);
                        }}
                        className="rounded border border-blue-300 p-2 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
                        title="Documents & specs"
                      >
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleEditClick(asset)}
                        className="rounded border border-gray-300 p-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-slate-800"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(asset.id)}
                        disabled={deletingId === asset.id}
                        className="rounded border border-red-300 p-2 hover:bg-red-50 disabled:opacity-50 dark:border-red-700 dark:hover:bg-red-900/20"
                        title="Delete"
                      >
                        {deletingId === asset.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <AssetForm
          asset={selectedAsset}
          spaces={spaces}
          systems={systems}
          onClose={() => {
            setShowForm(false);
            setSelectedAsset(undefined);
          }}
          onSuccess={loadData}
        />
      )}

      {/* Detail Modal */}
      {showDetail && detailAssetId && (
        <AssetDetail
          assetId={detailAssetId}
          assetName={
            assets.find((a) => a.id === detailAssetId)?.name || "Asset"
          }
          onClose={() => {
            setShowDetail(false);
            setDetailAssetId(null);
          }}
        />
      )}
    </>
  );
}
