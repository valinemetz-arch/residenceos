"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { DocumentList } from "./DocumentList";
import { toast } from "@/lib/toast";

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

interface WarrantyDetailProps {
  warrantyId: string;
  warrantyTitle: string;
  onClose: () => void;
}

export function WarrantyDetail({
  warrantyId,
  warrantyTitle,
  onClose,
}: WarrantyDetailProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const docsRes = await fetch(
        `/api/warranties/${warrantyId}/documents`
      );

      const docsData = await docsRes.json();

      if (docsData.success) setDocuments(docsData.data);
    } catch (error) {
      toast.error("Error", "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [warrantyId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-[#2D2D2D]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">{warrantyTitle}</h2>
          <button
            onClick={onClose}
            className="text-[#5A5A5A] hover:text-brand-charcoal dark:text-[#A8A8A8] dark:hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Documents Section */}
            <div>
              <h3 className="mb-4 text-lg font-semibold dark:text-white">
                Warranty Documents
              </h3>
              <div className="space-y-4">
                <DocumentList documents={documents} onDelete={loadFiles} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
