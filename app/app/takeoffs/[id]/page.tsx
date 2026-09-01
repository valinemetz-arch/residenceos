"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, ListChecks } from "lucide-react";
import { toast } from "@/lib/toast";

interface Trade {
  id: string;
  name: string;
}

interface TakeoffItem {
  id: string;
  description: string;
  quantity: number | null;
  unit: string | null;
  confidence: string;
  sourceNote: string | null;
  status: string;
  trade: Trade | null;
}

interface PlanPage {
  id: string;
  pageNumber: number;
  status: string;
}

interface PlanSet {
  id: string;
  name: string;
  status: string;
  pages: PlanPage[];
  items: TakeoffItem[];
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "tag tag-neutral",
  medium: "tag tag-outline",
  low: "tag tag-accent",
  manual_required: "tag tag-accent",
  needs_info: "tag tag-accent",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  manual_required: "Needs manual measurement",
  needs_info: "Needs your input",
};

export default function TakeoffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planSetId = params.id as string;

  const [planSet, setPlanSet] = useState<PlanSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [checkingReadiness, setCheckingReadiness] = useState(false);
  const cancelRef = useRef(false);

  const runExtractionLoop = async () => {
    setExtracting(true);
    try {
      while (!cancelRef.current) {
        const res = await fetch(`/api/plan-sets/${planSetId}/extract-page`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Extraction failed");

        setProgress({ processed: data.data.processedCount, total: data.data.totalCount });

        if (data.data.done) break;
      }
      if (!cancelRef.current) {
        const res = await fetch(`/api/plan-sets/${planSetId}`);
        const data = await res.json();
        if (data.success) setPlanSet(data.data);
      }
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/plan-sets/${planSetId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load plan set");
        setPlanSet(data.data);

        if (data.data.status === "extracting") {
          runExtractionLoop();
        }
      } catch (error) {
        toast.error("Error", "Failed to load plan set");
        router.push("/app/takeoffs");
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelRef.current = true;
    };
  }, [planSetId]);

  const updateItem = async (itemId: string, patch: Partial<TakeoffItem>) => {
    try {
      const res = await fetch(`/api/takeoff-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update item");

      setPlanSet((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) => (i.id === itemId ? data.data : i)),
            }
          : prev
      );
    } catch (error) {
      toast.error("Error", "Failed to update item");
    }
  };

  const handleCheckReadiness = async () => {
    setCheckingReadiness(true);
    try {
      const res = await fetch(`/api/plan-sets/${planSetId}/check-readiness`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to check readiness");

      const { tasksCreated } = data.data;
      toast.success(
        tasksCreated.length > 0 ? "Tasks created" : "All caught up",
        tasksCreated.length > 0
          ? `Created ${tasksCreated.length} task(s) - check your Tasks list.`
          : "No new gaps found."
      );
    } catch (error) {
      toast.error("Error", "Failed to check bid readiness");
    } finally {
      setCheckingReadiness(false);
    }
  };

  if (loading || !planSet) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const itemsByTrade = new Map<string, TakeoffItem[]>();
  for (const item of planSet.items) {
    const key = item.trade?.name || "Untagged";
    itemsByTrade.set(key, [...(itemsByTrade.get(key) || []), item]);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/app/takeoffs")} className="btn btn-icon">
          <ArrowLeft size={18} strokeWidth={1.8} />
        </button>
        <h1 style={{ fontSize: 25 }}>{planSet.name}</h1>
      </div>

      {extracting && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="card-meta" style={{ margin: 0 }}>
              Extracting page {progress.processed} of {progress.total}...
            </p>
          </div>
          <div style={{ height: 4, width: "100%", borderRadius: 999, background: "var(--color-neutral-200)" }}>
            <div
              style={{
                height: 4,
                borderRadius: 999,
                background: "var(--color-accent)",
                transition: "width 200ms ease",
                width: `${progress.total ? (progress.processed / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {planSet.status === "ready" && (
        <button onClick={handleCheckReadiness} disabled={checkingReadiness} className="btn btn-secondary" style={{ marginBottom: 20 }}>
          {checkingReadiness ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
          Check Bid Readiness
        </button>
      )}

      {!extracting && planSet.items.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p className="card-meta">No takeoff items were extracted from this plan set.</p>
        </div>
      )}

      {[...itemsByTrade.entries()].map(([tradeName, items]) => (
        <div key={tradeName} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-accent-700)",
              marginBottom: 10,
            }}
          >
            {tradeName}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item) => (
              <div key={item.id} className="card">
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      disabled={item.status !== "pending"}
                      style={{ width: "100%", border: "1px solid transparent", background: "transparent", fontWeight: 600, padding: "2px 4px" }}
                    />
                    <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <span className={CONFIDENCE_STYLES[item.confidence] || "tag tag-outline"}>
                        {CONFIDENCE_LABELS[item.confidence] || item.confidence}
                      </span>
                      {item.quantity != null && (
                        <span className="card-meta">
                          Qty: {item.quantity} {item.unit || ""}
                        </span>
                      )}
                      {item.status !== "pending" && (
                        <span className="card-meta" style={{ fontStyle: "italic" }}>{item.status}</span>
                      )}
                    </div>
                    {item.sourceNote && <p className="card-meta" style={{ marginTop: 4 }}>{item.sourceNote}</p>}
                  </div>
                  {item.status === "pending" && (
                    <div style={{ display: "flex", flexShrink: 0, gap: 8 }}>
                      <button onClick={() => updateItem(item.id, { status: "confirmed" })} className="btn btn-secondary">
                        <CheckCircle2 size={14} strokeWidth={1.8} />
                        Confirm
                      </button>
                      <button onClick={() => updateItem(item.id, { status: "rejected" })} className="btn">
                        <XCircle size={14} strokeWidth={1.8} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
