"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, FileText, AlertCircle } from "lucide-react";
import { WarrantyForm } from "./WarrantyForm";
import { toast } from "@/lib/toast";

interface Asset {
  id: string;
  name: string;
}

interface Space {
  id: string;
  name: string;
}

interface Warranty {
  [key: string]: unknown;
  id: string;
  title: string;
  description: string | null;
  coverageScope: string | null;
  startDate: string;
  endDate: string;
  months: number | null;
  assetId: string | null;
  spaceId: string | null;
  provider: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  claimProcess: string | null;
  serialNumber: string | null;
  status: string;
  createdAt: string;
}

export function WarrantyListWithForms() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [warrantiesRes, assetsRes, spacesRes] = await Promise.all([
        fetch("/api/warranties"),
        fetch("/api/assets"),
        fetch("/api/spaces"),
      ]);

      const warrantiesData = await warrantiesRes.json();
      const assetsData = await assetsRes.json();
      const spacesData = await spacesRes.json();

      if (warrantiesData.success) setWarranties(warrantiesData.data);
      if (assetsData.success) setAssets(assetsData.data);
      if (spacesData.success) setSpaces(spacesData.data);
    } catch (error) {
      toast.error("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddClick = () => {
    setSelectedWarranty(undefined);
    setShowForm(true);
  };

  const handleEditClick = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
    setShowForm(true);
  };

  const handleDeleteClick = async (warrantyId: string) => {
    if (!confirm("Are you sure you want to delete this warranty?")) {
      return;
    }

    setDeletingId(warrantyId);
    try {
      const response = await fetch(`/api/warranties/${warrantyId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete warranty");
      }

      toast.success("Warranty deleted", "Warranty has been removed successfully");
      await loadData();
    } catch (error) {
      toast.error(
        "Error",
        error instanceof Error ? error.message : "Failed to delete warranty"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "active":
        return "tag tag-outline";
      case "expired":
      case "claimed":
        return "tag tag-accent";
      case "voided":
        return "tag tag-neutral";
      default:
        return "tag tag-neutral";
    }
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

  const getExpiringWarranties = () => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return warranties.filter(
      (w) =>
        new Date(w.endDate) < thirtyDaysFromNow &&
        new Date(w.endDate) >= new Date()
    );
  };

  const expiring = getExpiringWarranties();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="classical">
      {/* Add Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <Plus size={16} strokeWidth={1.8} />
          Add Warranty
        </button>
      </div>

      {/* Expiring Soon Alert */}
      {expiring.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <AlertCircle size={18} strokeWidth={1.8} style={{ flexShrink: 0, color: "var(--color-accent-700)" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span className="tag tag-accent">
                  {expiring.length} Warrant{expiring.length === 1 ? "y" : "ies"} Expiring Soon
                </span>
              </div>
              <p className="card-meta" style={{ margin: 0 }}>
                {expiring.map((w) => w.title).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warranties List */}
      {warranties.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p className="card-meta">No warranties recorded yet. Add one to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleAddClick}>
            Add First Warranty
          </button>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Warranty</th>
              <th>Provider</th>
              <th>Expires</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {warranties.map((warranty) => {
              const expired = isExpired(warranty.endDate);
              return (
                <tr key={warranty.id}>
                  <td>
                    <div>{warranty.title}</div>
                    {warranty.coverageScope && (
                      <div className="card-meta">{warranty.coverageScope}</div>
                    )}
                  </td>
                  <td>{warranty.provider ?? "—"}</td>
                  <td>
                    {new Date(warranty.endDate).toLocaleDateString()}
                    {expired && (
                      <span className="tag tag-accent" style={{ marginLeft: 8 }}>
                        Expired
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={getStatusClass(warranty.status)}>{warranty.status}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button className="btn btn-icon" onClick={() => handleEditClick(warranty)} aria-label="Edit warranty">
                        <Edit2 size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        className="btn btn-icon"
                        onClick={() => handleDeleteClick(warranty.id)}
                        disabled={deletingId === warranty.id}
                        aria-label="Delete warranty"
                      >
                        {deletingId === warranty.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} strokeWidth={1.8} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Form Modal */}
      {showForm && (
        <WarrantyForm
          warranty={selectedWarranty}
          assets={assets}
          spaces={spaces}
          onClose={() => {
            setShowForm(false);
            setSelectedWarranty(undefined);
          }}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
