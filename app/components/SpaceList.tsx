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
        <p className="text-[#5A5A5A] dark:text-[#A8A8A8]">No spaces yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <Link key={space.id} href={`/app/spaces/${space.id}`}>
              <div className="bg-white dark:bg-[#2D2D2D] rounded-lg p-6 shadow-sm border border-[#D4D9CE] dark:border-[#1F1F1F] hover:shadow-md hover:border-brand-primary dark:hover:border-brand-secondary transition-all cursor-pointer">
                <h3 className="text-lg font-semibold mb-2">{space.name}</h3>
                <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8] mb-4">{space.building}</p>

                <div className="space-y-2 text-sm">
                  {space.squareFootage && (
                    <p>📐 {space.squareFootage.toLocaleString()} SF</p>
                  )}
                  <p>📦 {space._count.assets} Assets</p>
                  <p>✓ {space._count.tasks} Tasks</p>
                  <p>📷 {space._count.photos} Photos</p>
                </div>

                <div className="mt-4 pt-4 border-t border-[#D4D9CE] dark:border-[#1F1F1F]">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    space.status === 'completed'
                      ? 'bg-brand-success/10 text-brand-success dark:bg-brand-success/25 dark:text-brand-success'
                      : space.status === 'in_progress'
                      ? 'bg-brand-info/10 text-brand-info dark:bg-brand-info/25 dark:text-brand-info'
                      : 'bg-brand-gray/15 text-brand-dark-gray dark:bg-brand-gray/25 dark:text-white'
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