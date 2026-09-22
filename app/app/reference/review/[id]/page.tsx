"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { toast } from "@/lib/toast";

interface NamedRef {
  id: string;
  name: string;
}

interface PageRow {
  id: string;
  pageNumber: number;
  imageUrl: string;
  status: string;
  suggestedNote: string | null;
  confirmed: boolean;
  suggestedSpace: NamedRef | null;
  suggestedTrade: NamedRef | null;
  confirmedSpace: NamedRef | null;
  confirmedTrade: NamedRef | null;
}

// Review screen for a spec/elevation PDF that's been split into pages and
// AI-tagged: confirm or correct the suggested Space/Trade per page before it
// shows up on the Field Reference page. Nothing is visible there until
// confirmed here.
export default function ReviewDocumentPagesPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [pages, setPages] = useState<PageRow[]>([]);
  const [trades, setTrades] = useState<NamedRef[]>([]);
  const [spaces, setSpaces] = useState<NamedRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, { spaceId: string; tradeId: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const [pagesRes, tradesRes, spacesRes] = await Promise.all([
      fetch(`/api/documents/${documentId}/pages`),
      fetch("/api/trades"),
      fetch("/api/spaces"),
    ]);
    const pagesData = await pagesRes.json();
    const tradesData = await tradesRes.json();
    const spacesData = await spacesRes.json();

    const pageRows: PageRow[] = pagesData.data || [];
    setPages(pageRows);
    setTrades(tradesData.trades || []);
    if (spacesData.success) setSpaces(spacesData.data.map((s: NamedRef) => ({ id: s.id, name: s.name })));

    setDraft((prev) => {
      const next = { ...prev };
      for (const page of pageRows) {
        if (!next[page.id]) {
          next[page.id] = {
            spaceId: page.confirmedSpace?.id || page.suggestedSpace?.id || "",
            tradeId: page.confirmedTrade?.id || page.suggestedTrade?.id || "",
          };
        }
      }
      return next;
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [documentId]);

  const confirmPage = async (pageId: string) => {
    setSavingId(pageId);
    try {
      const choice = draft[pageId] || { spaceId: "", tradeId: "" };
      const res = await fetch(`/api/document-pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmedSpaceId: choice.spaceId || null,
          confirmedTradeId: choice.tradeId || null,
          confirmed: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to confirm page");
      toast.success("Confirmed", "Page is now visible on Field Reference");
      await load();
    } catch {
      toast.error("Error", "Failed to confirm page");
    } finally {
      setSavingId(null);
    }
  };

  const confirmAllAsSuggested = async () => {
    const unconfirmed = pages.filter((p) => !p.confirmed && (p.suggestedSpace || p.suggestedTrade));
    for (const page of unconfirmed) {
      await fetch(`/api/document-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmedSpaceId: page.suggestedSpace?.id || null,
          confirmedTradeId: page.suggestedTrade?.id || null,
          confirmed: true,
        }),
      });
    }
    toast.success("Confirmed", `${unconfirmed.length} page(s) confirmed as suggested`);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const confirmedCount = pages.filter((p) => p.confirmed).length;

  return (
    <div>
      <Link href="/app/reference" className="btn btn-icon" style={{ marginBottom: 12 }}>
        <ArrowLeft size={16} strokeWidth={1.8} />
      </Link>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <PortalHeader projectName="Nemetz Residence" pageTitle="Review Page Tags" />
        <button onClick={confirmAllAsSuggested} className="btn btn-primary" style={{ flexShrink: 0, marginTop: 4 }}>
          Confirm All As Suggested
        </button>
      </div>

      <p className="card-meta" style={{ marginBottom: 18 }}>
        {confirmedCount} of {pages.length} pages confirmed and visible on Field Reference.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
        {pages.map((page) => {
          const choice = draft[page.id] || { spaceId: "", tradeId: "" };
          return (
            <div key={page.id} className="card">
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="w-full bg-white object-contain"
                style={{ marginBottom: 10, border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)" }}
              />
              <p className="card-meta" style={{ marginBottom: 8 }}>
                Page {page.pageNumber}
                {page.suggestedNote ? ` — ${page.suggestedNote}` : ""}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                <select
                  value={choice.spaceId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [page.id]: { ...choice, spaceId: e.target.value } }))}
                  className="btn"
                >
                  <option value="">Space: none</option>
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={choice.tradeId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [page.id]: { ...choice, tradeId: e.target.value } }))}
                  className="btn"
                >
                  <option value="">Trade: none</option>
                  {trades.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => confirmPage(page.id)}
                disabled={savingId === page.id}
                className="btn"
                style={
                  page.confirmed
                    ? { borderColor: "var(--color-accent)", color: "var(--color-accent-700)", width: "100%" }
                    : { width: "100%" }
                }
              >
                {savingId === page.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check size={14} strokeWidth={1.8} />
                )}
                {page.confirmed ? "Confirmed — update" : "Confirm"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
