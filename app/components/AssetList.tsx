"use client";

import React, { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Asset {
  id: string;
  name: string;
  manufacturer?: string;
  model?: string;
  cost?: number;
  space: { name: string };
  system?: { name: string };
  status: string;
  _count: {
    photos: number;
    documents: number;
  };
}

export function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch("/api/assets");
        const data = await res.json();
        setAssets(data.data || []);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, []);

  if (loading) return <div>Loading assets...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Assets</h1>

      {assets.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No assets yet.</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 font-medium">{asset.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {asset.manufacturer || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">{asset.space.name}</td>
                    <td className="px-6 py-4 text-sm">
                      {asset.cost ? formatCurrency(asset.cost) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'installed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : asset.status === 'ordered'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}