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
        <p className="text-[#5A5A5A] dark:text-[#A8A8A8]">No assets yet.</p>
      ) : (
        <div className="bg-white dark:bg-[#2D2D2D] rounded-lg shadow-sm border border-[#D4D9CE] dark:border-[#1F1F1F] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-cream dark:bg-brand-charcoal border-b border-[#D4D9CE] dark:border-[#1F1F1F]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D9CE] dark:divide-[#1F1F1F]">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#F5F3F0] dark:hover:bg-[#1F1F1F] transition-colors">
                    <td className="px-6 py-4 font-medium">{asset.name}</td>
                    <td className="px-6 py-4 text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                      {asset.manufacturer || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">{asset.space.name}</td>
                    <td className="px-6 py-4 text-sm">
                      {asset.cost ? formatCurrency(asset.cost) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'installed'
                          ? 'bg-brand-success/10 text-brand-success dark:bg-brand-success/25 dark:text-brand-success'
                          : asset.status === 'ordered'
                          ? 'bg-brand-info/10 text-brand-info dark:bg-brand-info/25 dark:text-brand-info'
                          : 'bg-brand-gray/15 text-brand-dark-gray dark:bg-brand-gray/25 dark:text-white'
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