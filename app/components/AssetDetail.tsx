"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { DocumentUpload } from "./DocumentUpload";
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

interface AssetDetailProps {
  assetId: string;
  assetName: string;
  onClose: () => void;
}

export function AssetDetail({
  assetId,
  assetName,
  onClose,
}: AssetDetailProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const docsRes = await fetch(
        `/api/assets/${assetId}/documents`
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
  }, [assetId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">{assetName}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Product Documentation & Specifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                Documentation
              </h3>
              <div className="space-y-4">
                <DocumentUpload
                  entityType="asset"
                  entityId={assetId}
                  onSuccess={loadFiles}
                />
                <DocumentList documents={documents} onDelete={loadFiles} />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Upload manuals, spec sheets, warranties, maintenance guides, and other product documentation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
