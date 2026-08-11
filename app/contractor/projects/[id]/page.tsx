"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Download, FileText, ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import ProjectMessaging from "@/app/components/ProjectMessaging";

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
}

interface Contractor {
  id: string;
  email: string;
  companyName: string;
}

export default function ProjectDetails() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidData, setBidData] = useState<BidData>({ amount: "", notes: "" });

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      // Load contractor info
      const meResponse = await fetch("/api/auth/contractor/me");
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setContractor(meData.data);
      } else {
        router.push("/contractor/login");
        return;
      }

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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit bid");
      }

      toast.success("Success", "Bid submitted successfully");
      setBidData({ amount: "", notes: "" });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-8">
        <p className="text-gray-600 dark:text-gray-400">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/contractor")}
            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{project.address}</p>
          </div>
        </div>

        {/* Project Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
            <p className="text-2xl font-bold dark:text-white mt-2">
              ${project.budget?.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
            <p className="text-2xl font-bold dark:text-white mt-2">{documents.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Project Type</p>
            <p className="text-lg font-bold dark:text-white mt-2">Renovation</p>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold dark:text-white mb-3">Project Description</h2>
            <p className="text-gray-700 dark:text-gray-300">{project.description}</p>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Plans & Specifications
          </h2>
          {documents.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No documents available yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <div>
                    <p className="font-medium dark:text-white">{doc.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      v{doc.versionNumber} • {new Date(doc.revisionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messaging */}
        <ProjectMessaging projectId={projectId} />

        {/* Bid Submission */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-8">
          <h2 className="text-xl font-bold dark:text-white mb-4">Submit Your Bid</h2>
          <form onSubmit={handleBidSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Bid Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={bidData.amount}
                onChange={(e) => setBidData({ ...bidData, amount: e.target.value })}
                placeholder="Enter your bid amount"
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={bidData.notes}
                onChange={(e) => setBidData({ ...bidData, notes: e.target.value })}
                placeholder="Add any notes about your bid..."
                rows={4}
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={submittingBid}
              className="w-full bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submittingBid && <Loader2 className="h-4 w-4 animate-spin" />}
              {submittingBid ? "Submitting..." : "Submit Bid"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
