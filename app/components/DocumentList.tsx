"use client";

import { useState } from "react";
import { Trash2, Loader2, Download, FileText, Zap } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatFileSize } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  type: string;
  description: string | null;
  createdAt: string;
}

interface DocumentListProps {
  documents: Document[];
  onDelete: () => void;
  onAmountParsed?: (amount: number) => void;
}

export function DocumentList({ documents, onDelete, onAmountParsed }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [parsingId, setParsingId] = useState<string | null>(null);

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;

    setDeletingId(docId);
    try {
      const response = await fetch(`/api/documents?id=${docId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      toast.success("Document deleted", "Document removed successfully");
      onDelete();
    } catch (error) {
      toast.error("Error", "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const handleParseAmount = async (doc: Document) => {
    setParsingId(doc.id);
    try {
      const response = await fetch("/api/parse-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: doc.fileUrl,
          fileName: doc.name,
          fileType: doc.fileType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse invoice");
      }

      if (result.data?.amount) {
        toast.success(
          "Amount extracted",
          `Found: $${result.data.amount.toFixed(2)} (${result.data.confidence} confidence)`
        );
        if (onAmountParsed) {
          onAmountParsed(result.data.amount);
        }
      } else {
        toast.error(
          "No amount found",
          "Could not extract an amount from this document"
        );
      }
    } catch (error) {
      toast.error(
        "Parse failed",
        error instanceof Error ? error.message : "Failed to parse invoice"
      );
    } finally {
      setParsingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
        No documents yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-lg border border-[#D4D9CE] bg-brand-cream p-3 dark:border-[#1F1F1F] dark:bg-brand-charcoal"
        >
          <FileText className="h-5 w-5 flex-shrink-0 text-brand-gray" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate dark:text-white">
              {doc.name}
            </p>
            <div className="flex gap-2 text-xs text-[#5A5A5A] dark:text-[#A8A8A8]">
              <span>{doc.type}</span>
              {doc.fileSize && <span>•</span>}
              {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
            </div>
            {doc.description && (
              <p className="mt-1 text-xs text-[#5A5A5A] dark:text-[#A8A8A8] line-clamp-1">
                {doc.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {doc.type === "invoice" && (
              <button
                onClick={() => handleParseAmount(doc)}
                disabled={parsingId === doc.id}
                className="rounded p-2 hover:bg-brand-primary/5 disabled:opacity-50 dark:hover:bg-brand-secondary/10"
                title="Extract amount from invoice"
              >
                {parsingId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-primary dark:text-brand-secondary" />
                ) : (
                  <Zap className="h-4 w-4 text-brand-primary dark:text-brand-secondary" />
                )}
              </button>
            )}
            <a
              href={doc.fileUrl}
              download
              className="rounded p-2 hover:bg-brand-cream dark:hover:bg-brand-charcoal"
            >
              <Download className="h-4 w-4 text-[#5A5A5A] dark:text-[#A8A8A8]" />
            </a>
            <button
              onClick={() => handleDelete(doc.id)}
              disabled={deletingId === doc.id}
              className="rounded p-2 hover:bg-brand-error/10 disabled:opacity-50 dark:hover:bg-brand-error/15"
            >
              {deletingId === doc.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand-error" />
              ) : (
                <Trash2 className="h-4 w-4 text-brand-error" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
