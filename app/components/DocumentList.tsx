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
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No documents yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-slate-800"
        >
          <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate dark:text-white">
              {doc.name}
            </p>
            <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{doc.type}</span>
              {doc.fileSize && <span>•</span>}
              {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
            </div>
            {doc.description && (
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                {doc.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {doc.type === "invoice" && (
              <button
                onClick={() => handleParseAmount(doc)}
                disabled={parsingId === doc.id}
                className="rounded p-2 hover:bg-blue-100 disabled:opacity-50 dark:hover:bg-blue-900/20"
                title="Extract amount from invoice"
              >
                {parsingId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Zap className="h-4 w-4 text-blue-600" />
                )}
              </button>
            )}
            <a
              href={doc.fileUrl}
              download
              className="rounded p-2 hover:bg-gray-200 dark:hover:bg-slate-700"
            >
              <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </a>
            <button
              onClick={() => handleDelete(doc.id)}
              disabled={deletingId === doc.id}
              className="rounded p-2 hover:bg-red-100 disabled:opacity-50 dark:hover:bg-red-900/20"
            >
              {deletingId === doc.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
              ) : (
                <Trash2 className="h-4 w-4 text-red-600" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
