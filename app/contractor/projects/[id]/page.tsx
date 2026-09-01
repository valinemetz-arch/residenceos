"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Download, FileText } from "lucide-react";
import { toast } from "@/lib/toast";
import ProjectMessaging from "@/app/components/ProjectMessaging";
import ProjectScope from "@/app/components/contractor/ProjectScope";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";

interface Project {
  id: string;
  name: string;
  address: string;
  description: string;
  budget: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileName: string;
  versionNumber: number;
  revisionDate: string;
}

interface BidData {
  amount: string;
  notes: string;
  includesInstallation: boolean;
  installEstimate: string;
}

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidData, setBidData] = useState<BidData>({
    amount: "",
    notes: "",
    includesInstallation: true,
    installEstimate: "",
  });

  const loadProjectData = async () => {
    try {
      setLoading(true);

      // Load project
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Project not found");
      }
      const data = await response.json();
      setProject(data.data);

      // Load project documents
      const docsResponse = await fetch(`/api/documents?projectId=${projectId}`);
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.data || []);
      }
    } catch (error) {
      toast.error("Error", "Failed to load project");
      router.push("/contractor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !contractor) return;
    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, authLoading, contractor]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidData.amount) {
      toast.error("Error", "Please enter a bid amount");
      return;
    }

    if (!contractor) {
      toast.error("Error", "Contractor not loaded");
      return;
    }

    try {
      setSubmittingBid(true);
      const response = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          contractorId: contractor.id,
          amount: parseFloat(bidData.amount),
          notes: bidData.notes,
          includesInstallation: bidData.includesInstallation,
          installEstimate: bidData.installEstimate || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit bid");
      }

      toast.success("Success", "Bid submitted successfully");
      setBidData({ amount: "", notes: "", includesInstallation: true, installEstimate: "" });
      loadProjectData();
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Failed to submit bid");
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleDownload = (doc: Document) => {
    const link = document.createElement("a");
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.click();
  };

  if (authLoading || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeNames.join(", ")}>
        <PortalHeader projectName="ResidenceOS" pageTitle="Project Details" />
        <p className="card-meta">Project not found</p>
      </PortalShell>
    );
  }

  return (
    <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeNames.join(", ")}>
      <PortalHeader projectName={project.name} pageTitle="Project Details" />

      <p className="card-meta" style={{ marginTop: -16, marginBottom: 26 }}>{project.address}</p>

      {/* Project Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 26 }}>
        <div className="card">
          <div className="card-kicker">Budget</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, marginTop: 6 }}>
            ${project.budget?.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="card-kicker">Documents</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, marginTop: 6 }}>
            {documents.length}
          </div>
        </div>
        <div className="card">
          <div className="card-kicker">Project Type</div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, marginTop: 6 }}>
            Renovation
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="card" style={{ marginBottom: 26 }}>
          <h3 style={{ marginBottom: 10 }}>Project Description</h3>
          <p style={{ margin: 0 }}>{project.description}</p>
        </div>
      )}

      {/* Documents */}
      <div className="card" style={{ marginBottom: 26 }}>
        <h3 style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={18} strokeWidth={1.8} />
          Plans &amp; Specifications
        </h3>
        {documents.length === 0 ? (
          <p className="card-meta">No documents available yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="wp-row-tap"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  border: "1px solid var(--color-divider)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{doc.name}</div>
                  <div className="card-meta">
                    v{doc.versionNumber} • {new Date(doc.revisionDate).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => handleDownload(doc)} className="btn btn-secondary">
                  <Download size={14} strokeWidth={1.8} />
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scope of Work for contractor's trade(s) */}
      <ProjectScope projectId={projectId} />

      {/* Messaging */}
      <ProjectMessaging projectId={projectId} />

      {/* Bid Submission */}
      <div className="card" style={{ marginTop: 26 }}>
        <h3 style={{ marginBottom: 14 }}>Submit Your Bid</h3>
        <form onSubmit={handleBidSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Bid Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={bidData.amount}
              onChange={(e) => setBidData({ ...bidData, amount: e.target.value })}
              placeholder="Enter your bid amount"
              style={{ width: "100%" }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Notes (Optional)
            </label>
            <textarea
              value={bidData.notes}
              onChange={(e) => setBidData({ ...bidData, notes: e.target.value })}
              placeholder="Add any notes about your bid..."
              rows={4}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="includesInstallation"
              checked={bidData.includesInstallation}
              onChange={(e) =>
                setBidData({ ...bidData, includesInstallation: e.target.checked })
              }
              style={{ width: 16, height: 16 }}
            />
            <label htmlFor="includesInstallation" style={{ fontSize: 13, fontWeight: 600 }}>
              This bid includes installation
            </label>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Estimated Time to Install (Optional)
            </label>
            <input
              type="text"
              value={bidData.installEstimate}
              onChange={(e) => setBidData({ ...bidData, installEstimate: e.target.value })}
              placeholder="e.g., 2 days, 16-20 hrs"
              style={{ width: "100%" }}
            />
          </div>

          <button type="submit" disabled={submittingBid} className="btn btn-primary" style={{ justifyContent: "center" }}>
            {submittingBid && <Loader2 className="h-4 w-4 animate-spin" />}
            {submittingBid ? "Submitting..." : "Submit Bid"}
          </button>
        </form>
      </div>
    </PortalShell>
  );
}
