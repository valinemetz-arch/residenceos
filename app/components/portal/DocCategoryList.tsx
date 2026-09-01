import { FileText, Download } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

export interface CategoryDoc {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number | null;
}

export function DocCategoryList({ label, docs }: { label: string; docs: CategoryDoc[] }) {
  if (docs.length === 0) return null;

  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-accent-700)",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {docs.map((doc) => (
          <a
            key={doc.id}
            href={doc.fileUrl}
            download
            className="card wp-row-tap"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", textDecoration: "none" }}
          >
            <FileText size={22} strokeWidth={1.6} color="var(--color-accent-700)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--color-text)",
                }}
              >
                {doc.name}
              </div>
              {doc.fileSize && <div className="card-meta" style={{ marginTop: 2 }}>{formatFileSize(doc.fileSize)}</div>}
            </div>
            <Download size={18} strokeWidth={1.8} color="var(--color-neutral-600)" style={{ flexShrink: 0 }} />
          </a>
        ))}
      </div>
    </div>
  );
}
