"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Loader2, Upload, FileText } from "lucide-react";
import { toast } from "@/lib/toast";

interface Project {
  id: string;
  name: string;
}

interface PlanSet {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  _count: { pages: number; items: number };
}

const STATUS_LABELS: Record<string, string> = {
  rendering: "Rendering pages...",
  extracting: "Ready to extract",
  ready: "Ready for review",
  failed: "Failed",
};

export default function TakeoffsPage() {
  const router = useRouter();
  const [planSets, setPlanSets] = useState<PlanSet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [planSetsRes, projectsRes] = await Promise.all([
          fetch("/api/plan-sets"),
          fetch("/api/projects"),
        ]);
        const planSetsData = await planSetsRes.json();
        const projectsData = await projectsRes.json();
        if (planSetsData.success) setPlanSets(planSetsData.data);
        if (projectsData.success) {
          setProjects(projectsData.data);
          if (projectsData.data.length === 1) setProjectId(projectsData.data[0].id);
        }
      } catch (error) {
        toast.error("Error", "Failed to load plan sets");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Error", "Please choose a PDF file");
      return;
    }

    setUploading(true);
    try {
      // Upload straight from the browser to Blob storage - permit sets are
      // often tens of MB, well past Vercel's 4.5MB Function body limit, so
      // the file never passes through our own server here.
      const blob = await upload(`plan-sets/source/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/plan-sets/upload-token",
        multipart: true,
      });

      const res = await fetch("/api/plan-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: blob.url,
          fileName: file.name,
          fileSize: file.size,
          name: name || file.name,
          projectId: projectId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      toast.success("Plan set uploaded", `Rendered ${data.data.pages?.length ?? 0} page(s)`);
      router.push(`/app/takeoffs/${data.data.id}`);
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>Floor Plan Takeoffs</h1>
        <p className="card-meta" style={{ marginTop: 8 }}>
          Upload a plan set PDF and AI extracts a material/quantity takeoff per trade for you to review before bidding.
        </p>
      </div>

      {/* Upload form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upload a Plan Set</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
              PDF File
            </label>
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 7/22/26 Permit Set"
              style={{ width: "100%" }}
            />
          </div>
          {projects.length > 0 && (
            <div>
              <label className="card-meta" style={{ display: "block", marginBottom: 4 }}>
                Project (optional - links this takeoff to a contractor-portal project)
              </label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: "100%" }}>
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleUpload} disabled={uploading || !file} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading & rendering..." : "Upload"}
          </button>
        </div>
      </div>

      {/* Plan set list */}
      {planSets.length === 0 ? (
        <p className="card-meta">No plan sets uploaded yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {planSets.map((ps) => (
            <Link key={ps.id} href={`/app/takeoffs/${ps.id}`} className="card wp-row-tap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <FileText size={20} strokeWidth={1.6} color="var(--color-neutral-600)" />
                <div>
                  <div className="card-title" style={{ fontSize: 15 }}>{ps.name}</div>
                  <div className="card-meta">
                    {ps._count.pages} page(s) · {ps._count.items} item(s) extracted
                  </div>
                </div>
              </div>
              <span className="card-meta">{STATUS_LABELS[ps.status] || ps.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
