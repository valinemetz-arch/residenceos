"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { toast } from "@/lib/toast";

interface NamedRef {
  id: string;
  name: string;
}

interface ContractorRef {
  id: string;
  companyName: string;
  contactName: string | null;
  trades: string[];
}

type VisibleTo = "trade" | "contractor" | "all";

export default function UploadReferenceDocumentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [trades, setTrades] = useState<NamedRef[]>([]);
  const [contractors, setContractors] = useState<ContractorRef[]>([]);
  const [spaces, setSpaces] = useState<NamedRef[]>([]);
  const [name, setName] = useState("");
  const [visibleTo, setVisibleTo] = useState<VisibleTo>("trade");
  const [tradeId, setTradeId] = useState("");
  const [contractorId, setContractorId] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [splitPages, setSplitPages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [tradesRes, spacesRes, assigneesRes] = await Promise.all([
        fetch("/api/trades"),
        fetch("/api/spaces"),
        fetch("/api/assignees"),
      ]);
      const tradesData = await tradesRes.json();
      const spacesData = await spacesRes.json();
      const assigneesData = await assigneesRes.json();
      setTrades(tradesData.trades || []);
      if (spacesData.success) setSpaces(spacesData.data.map((s: NamedRef) => ({ id: s.id, name: s.name })));
      if (assigneesData.success) setContractors(assigneesData.data.contractors || []);
    })();
  }, []);

  const handleSubmit = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Error", "Choose a PDF to upload");
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Error", "Field Reference sheets must be PDFs");
      return;
    }
    if (visibleTo === "trade" && !tradeId) {
      toast.error("Error", "Choose which trade this is for");
      return;
    }
    if (visibleTo === "contractor" && !contractorId) {
      toast.error("Error", "Choose which contractor this is for");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "reference");
      formData.append("entityId", "spec-sheets");

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || file.name,
          type: "spec_sheet",
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.filename,
          fileSize: uploadData.fileSize,
          fileType: uploadData.fileType,
          tradeId: visibleTo === "trade" ? tradeId || null : null,
          contractorId: visibleTo === "contractor" ? contractorId || null : null,
          visibleToAll: visibleTo === "all",
          spaceId: spaceId || null,
        }),
      });
      const docData = await docRes.json();
      if (!docRes.ok) throw new Error(docData.message || "Failed to save document");
      const documentId = docData.data.id;

      if (!splitPages) {
        toast.success("Uploaded", `${file.name} added to Field Reference`);
        router.push("/app/reference");
        return;
      }

      const splitRes = await fetch(`/api/documents/${documentId}/split-pages`, { method: "POST" });
      const splitData = await splitRes.json();
      if (!splitRes.ok) throw new Error(splitData.message || "Failed to split pages");

      const total = splitData.data.pageCount;
      setProgress({ done: 0, total });

      // Tag one page per request until the loop reports done, mirroring the
      // floor-plan takeoff extraction pattern - keeps each request short.
      let done = false;
      let processed = 0;
      while (!done) {
        const tagRes = await fetch(`/api/documents/${documentId}/tag-page`, { method: "POST" });
        const tagData = await tagRes.json();
        if (!tagRes.ok) throw new Error(tagData.message || "Tagging failed");
        done = tagData.data.done;
        processed = tagData.data.processedCount;
        setProgress({ done: processed, total: tagData.data.totalCount });
      }

      toast.success("Pages tagged", "Review the suggested tags before they go live");
      router.push(`/app/reference/review/${documentId}`);
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Link href="/app/reference" className="btn btn-icon" style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} strokeWidth={1.8} />
      </Link>
      <PortalHeader projectName="Nemetz Residence" pageTitle="Upload Spec / Elevation Sheet" />

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>PDF File</label>
          <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="btn" style={{ width: "100%" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Interior Elevations - Rev C"
            className="btn"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Visible to</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {(
              [
                ["trade", "A Trade"],
                ["contractor", "One Contractor"],
                ["all", "Everyone"],
              ] as [VisibleTo, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibleTo(value)}
                className="btn"
                style={
                  visibleTo === value
                    ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)" }
                    : undefined
                }
              >
                {label}
              </button>
            ))}
          </div>

          {visibleTo === "trade" && (
            <select value={tradeId} onChange={(e) => setTradeId(e.target.value)} className="btn" style={{ width: "100%" }}>
              <option value="">— Choose a trade —</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {visibleTo === "contractor" && (
            <select
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              className="btn"
              style={{ width: "100%" }}
            >
              <option value="">— Choose a contractor —</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                  {c.contactName ? ` (${c.contactName})` : ""}
                  {c.trades.length > 0 ? ` — ${c.trades.join(", ")}` : ""}
                </option>
              ))}
            </select>
          )}
          {visibleTo === "all" && (
            <p className="card-meta">Every registered contractor will see this, regardless of trade.</p>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Space (optional)</label>
          <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className="btn" style={{ width: "100%" }}>
            <option value="">— None —</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 18, fontSize: 13 }}>
          <input type="checkbox" checked={splitPages} onChange={(e) => setSplitPages(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            This is a multi-page set (e.g. a full interior-elevations booklet). Split it into individual pages and let
            AI suggest the space + trade for each, for you to confirm. Leave unchecked for a single-sheet spec you're
            tagging yourself above.
          </span>
        </label>

        {progress && (
          <p className="card-meta" style={{ marginBottom: 12 }}>
            Tagging page {progress.done} of {progress.total}...
          </p>
        )}

        <button onClick={handleSubmit} disabled={uploading} className="btn btn-primary">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={16} strokeWidth={1.8} />}
          {uploading ? "Working..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
