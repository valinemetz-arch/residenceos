"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Space {
  id: string;
  name: string;
  building: string;
  squareFootage?: number;
  status: string;
  _count: {
    assets: number;
    tasks: number;
    photos: number;
  };
}

export function SpaceList() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpaces() {
      try {
        const res = await fetch("/api/spaces");
        const data = await res.json();
        setSpaces(data.data || []);
      } catch (error) {
        console.error("Failed to fetch spaces:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSpaces();
  }, []);

  if (loading) return <div>Loading spaces...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Spaces</h1>

      {spaces.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No spaces yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <Link key={space.id} href={`/app/spaces/${space.id}`}>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer">
                <h3 className="text-lg font-semibold mb-2">{space.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{space.building}</p>

                <div className="space-y-2 text-sm">
                  {space.squareFootage && (
                    <p>📐 {space.squareFootage.toLocaleString()} SF</p>
                  )}
                  <p>📦 {space._count.assets} Assets</p>
                  <p>✓ {space._count.tasks} Tasks</p>
                  <p>📷 {space._count.photos} Photos</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    space.status === 'completed'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : space.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {space.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}