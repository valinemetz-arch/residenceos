"use client";

import React, { useEffect, useState } from "react";

export default function SystemsPage() {
  const [systems, setSystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSystems() {
      try {
        const res = await fetch("/api/systems");
        const data = await res.json();
        setSystems(data.data || []);
      } catch (error) {
        console.error("Failed to fetch systems:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSystems();
  }, []);

  if (loading) return <div>Loading systems...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Building Systems</h1>

      {systems.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No systems yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((system) => (
            <div
              key={system.id}
              className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700"
            >
              <h3 className="text-lg font-semibold mb-2">{system.name}</h3>
              {system.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {system.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <p>📦 {system._count.assets} Assets</p>
                <p>✓ {system._count.tasks} Tasks</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}