"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { PhotoUpload } from "./PhotoUpload";
import { PhotoGallery } from "./PhotoGallery";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";
import { toast } from "@/lib/toast";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

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

interface TaskDetailProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

export function TaskDetail({ taskId, taskTitle, onClose }: TaskDetailProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const [photosRes, docsRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}/photos`),
        fetch(`/api/tasks/${taskId}/documents`),
      ]);

      const photosData = await photosRes.json();
      const docsData = await docsRes.json();

      if (photosData.success) setPhotos(photosData.data);
      if (docsData.success) setDocuments(docsData.data);
    } catch (error) {
      toast.error("Error", "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [taskId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">{taskTitle}</h2>
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
            {/* Photos Section */}
            <div>
              <h3 className="mb-4 text-lg font-semibold dark:text-white">
                Photos
              </h3>
              <div className="space-y-4">
                <PhotoUpload
                  entityType="task"
                  entityId={taskId}
                  onSuccess={loadFiles}
                />
                <PhotoGallery photos={photos} onDelete={loadFiles} />
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h3 className="mb-4 text-lg font-semibold dark:text-white">
                Documents
              </h3>
              <div className="space-y-4">
                <DocumentUpload
                  entityType="task"
                  entityId={taskId}
                  onSuccess={loadFiles}
                />
                <DocumentList documents={documents} onDelete={loadFiles} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
