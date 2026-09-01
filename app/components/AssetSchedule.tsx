"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { AssetWithRelations } from "@/lib/types";

interface Asset extends AssetWithRelations {}

const CATEGORY_ORDER = ["Doors", "Windows", "Appliances", "Plumbing"];
const UNCATEGORIZED = "Uncategorized";

export function AssetSchedule() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    // Read an optional ?category= filter from the URL on first load
    // (e.g. linked from the Assets page's category filter).
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category) setActiveCategory(category);

    (async () => {
      try {
        const res = await fetch("/api/assets");
        const json = await res.json();
        if (json.success) setAssets(json.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const present = new Set(assets.map((a) => a.system?.name || UNCATEGORIZED));
    const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
    const extras = [...present]
      .filter((c) => c !== UNCATEGORIZED && !CATEGORY_ORDER.includes(c))
      .sort();
    const rest = present.has(UNCATEGORIZED) ? [UNCATEGORIZED] : [];
    return [...ordered, ...extras, ...rest];
  }, [assets]);

  const groups = useMemo(() => {
    const byCategory = new Map<string, Asset[]>();
    for (const category of categories) byCategory.set(category, []);
    for (const asset of assets) {
      const category = asset.system?.name || UNCATEGORIZED;
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category)!.push(asset);
    }
    for (const list of byCategory.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    const visibleCategories =
      activeCategory === "All" ? categories : categories.filter((c) => c === activeCategory);
    return visibleCategories.map((category) => ({
      category,
      items: byCategory.get(category) || [],
    }));
  }, [assets, categories, activeCategory]);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Screen-only controls */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/app/assets"
            className="mb-2 flex items-center gap-1 text-sm text-[#5A5A5A] hover:text-[#2D5016] dark:text-[#A8A8A8] dark:hover:text-[#C9A876]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assets
          </Link>
          <h1 className="text-3xl font-bold dark:text-white">Asset Schedule</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded bg-[#2D5016] px-4 py-2 font-medium text-white hover:opacity-90 dark:bg-[#C9A876] dark:text-[#1F1F1F]"
        >
          <Printer className="h-5 w-5" />
          Print
        </button>
      </div>

      <div className="no-print mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("All")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === "All"
              ? "bg-[#2D5016] text-white dark:bg-[#C9A876] dark:text-[#1F1F1F]"
              : "border border-[#D4D9CE] text-[#5A5A5A] hover:bg-[#F5F3F0] dark:border-[#1F1F1F] dark:text-[#A8A8A8] dark:hover:bg-[#1F1F1F]"
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-[#2D5016] text-white dark:bg-[#C9A876] dark:text-[#1F1F1F]"
                : "border border-[#D4D9CE] text-[#5A5A5A] hover:bg-[#F5F3F0] dark:border-[#1F1F1F] dark:text-[#A8A8A8] dark:hover:bg-[#1F1F1F]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Print header */}
      <div className="mb-8 hidden border-b-2 border-[#2D5016] pb-4 print:block">
        <h1 className="font-[Georgia,Garamond,serif] text-2xl font-bold text-[#2D5016]">
          Nemetz Residence - Asset Schedule
        </h1>
        <p className="text-sm text-[#5A5A5A]">
          {activeCategory === "All" ? "All Categories" : activeCategory} &middot; Printed{" "}
          {today}
        </p>
      </div>

      {/* Schedule */}
      {assets.length === 0 ? (
        <p className="text-[#5A5A5A] dark:text-[#A8A8A8]">No assets yet.</p>
      ) : (
        <div className="space-y-10">
          {groups.map(
            ({ category, items }) =>
              items.length > 0 && (
                <div key={category} className="break-inside-avoid">
                  <h2 className="mb-3 font-[Georgia,Garamond,serif] text-xl font-bold text-[#2D5016] dark:text-[#C9A876] print:text-black">
                    {category}{" "}
                    <span className="text-sm font-normal text-[#5A5A5A] dark:text-[#A8A8A8] print:text-gray-600">
                      ({items.length})
                    </span>
                  </h2>
                  <div className="overflow-x-auto rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] print:overflow-visible print:rounded-none print:border-black">
                    <table className="w-full text-sm">
                      <thead className="border-b border-[#D4D9CE] bg-brand-cream dark:border-[#1F1F1F] dark:bg-brand-charcoal print:bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold dark:text-[#F5F3F0]">
                            Item
                          </th>
                          <th className="px-4 py-2 text-left font-semibold dark:text-[#F5F3F0]">
                            Manufacturer
                          </th>
                          <th className="px-4 py-2 text-left font-semibold dark:text-[#F5F3F0]">
                            Model #
                          </th>
                          <th className="px-4 py-2 text-left font-semibold dark:text-[#F5F3F0]">
                            Size
                          </th>
                          <th className="px-4 py-2 text-left font-semibold dark:text-[#F5F3F0]">
                            Selection / Finish
                          </th>
                          <th className="px-4 py-2 text-left font-semibold dark:text-[#F5F3F0]">
                            Location
                          </th>
                          <th className="px-4 py-2 text-left font-semibold dark:text-[#F5F3F0]">
                            Cost
                          </th>
                          <th className="px-4 py-2 text-left font-semibold dark:text-[#F5F3F0]">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D4D9CE] dark:divide-[#1F1F1F]">
                        {items.map((asset) => (
                          <tr key={asset.id} className="bg-white dark:bg-[#2D2D2D]">
                            <td className="px-4 py-2 font-medium dark:text-white">
                              {asset.name}
                            </td>
                            <td className="px-4 py-2 text-[#5A5A5A] dark:text-[#A8A8A8]">
                              {asset.manufacturer || "—"}
                            </td>
                            <td className="px-4 py-2 text-[#5A5A5A] dark:text-[#A8A8A8]">
                              {asset.model || "—"}
                            </td>
                            <td className="px-4 py-2 text-[#5A5A5A] dark:text-[#A8A8A8]">
                              {asset.size || "—"}
                            </td>
                            <td className="px-4 py-2 text-[#5A5A5A] dark:text-[#A8A8A8]">
                              {asset.finish || "—"}
                            </td>
                            <td className="px-4 py-2 text-[#5A5A5A] dark:text-[#A8A8A8]">
                              {asset.space?.name || "—"}
                            </td>
                            <td className="px-4 py-2 text-[#5A5A5A] dark:text-[#A8A8A8]">
                              {asset.cost ? formatCurrency(asset.cost) : "—"}
                            </td>
                            <td className="px-4 py-2 text-[#5A5A5A] dark:text-[#A8A8A8]">
                              {asset.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}
