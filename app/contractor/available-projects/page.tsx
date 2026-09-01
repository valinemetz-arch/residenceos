"use client";

import { useEffect, useState } from "react";
import { Loader2, DollarSign } from "lucide-react";
import Link from "next/link";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";

interface Project {
  id: string;
  name: string;
  address: string;
  budget: number;
}

export default function AvailableProjectsPage() {
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !contractor) return;
    (async () => {
      const res = await fetch(`/api/projects?contractorId=${contractor.id}`);
      const data = await res.json();
      if (data.success) setProjects(data.data || []);
      setLoading(false);
    })();
  }, [authLoading, contractor]);

  if (authLoading || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeNames.join(", ")}>
      <PortalHeader projectName="ResidenceOS" pageTitle="Available Projects" />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <p className="card-meta">No projects available at this time.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {projects.map((project) => (
            <Link key={project.id} href={`/contractor/projects/${project.id}`} className="card wp-row-tap" style={{ display: "block", textDecoration: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="card-title">{project.name}</div>
                  <div className="card-meta" style={{ marginTop: 4 }}>{project.address}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-accent-700)" }}>
                  <DollarSign size={16} strokeWidth={1.8} />
                  <span style={{ fontWeight: 600 }}>{project.budget?.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
