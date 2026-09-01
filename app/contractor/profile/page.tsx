"use client";

import { useEffect, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "@/lib/toast";
import TradeSelector from "@/app/components/admin/TradeSelector";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";

interface ContractorProfile {
  id: string;
  email: string;
  companyName: string;
  contactName?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  licenseDocument?: string;
  insuranceExpiry?: string;
  insuranceDocument?: string;
}

interface ExtractedInfo {
  email?: string;
  phone?: string;
  website?: string;
  logo?: string;
  address?: string;
  confidence: "high" | "medium" | "low";
  details: string;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: "var(--color-neutral-700)",
};

export default function ContractorProfile() {
  const { loading: authLoading, contractor: authContractor, tradeNames } = useContractorAuth();
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [extracted, setExtracted] = useState<ExtractedInfo | null>(null);

  const [formData, setFormData] = useState({
    contactName: "",
    phone: "",
    address: "",
    website: "",
    licenseNumber: "",
    licenseExpiry: "",
    insuranceExpiry: "",
  });

  const [uploads, setUploads] = useState({
    logo: null as File | null,
    licenseDocument: null as File | null,
    insuranceDocument: null as File | null,
  });

  const [tradeIds, setTradeIds] = useState<string[]>([]);
  const [savingTrades, setSavingTrades] = useState(false);

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/auth/contractor/me");
      if (!response.ok) return;
      const data = await response.json();
      const contractorData = data.data as ContractorProfile;
      setProfile(contractorData);
      setFormData({
        contactName: contractorData.contactName || "",
        phone: contractorData.phone || "",
        address: contractorData.address || "",
        website: contractorData.website || "",
        licenseNumber: contractorData.licenseNumber || "",
        licenseExpiry: contractorData.licenseExpiry ? contractorData.licenseExpiry.split("T")[0] : "",
        insuranceExpiry: contractorData.insuranceExpiry
          ? contractorData.insuranceExpiry.split("T")[0]
          : "",
      });
    } catch (error) {
      toast.error("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadTrades = async () => {
    try {
      const response = await fetch("/api/contractor/trades");
      if (!response.ok) return;
      const data = await response.json();
      setTradeIds((data.trades || []).map((t: { id: string }) => t.id));
    } catch (error) {
      // Non-fatal - trades section will just start empty
    }
  };

  useEffect(() => {
    if (authLoading || !authContractor) return;
    loadProfile();
    loadTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, authContractor]);

  const saveTrades = async () => {
    try {
      setSavingTrades(true);
      const response = await fetch("/api/contractor/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeIds }),
      });
      if (!response.ok) throw new Error("Failed to save trades");
      toast.success("Success", "Your trades have been updated");
    } catch (error) {
      toast.error("Error", "Failed to save trades");
    } finally {
      setSavingTrades(false);
    }
  };

  const extractFromWebsite = async () => {
    if (!websiteUrl) {
      toast.error("Error", "Please enter a website URL");
      return;
    }

    try {
      setExtracting(true);
      const response = await fetch("/api/contractor/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract information");
      }

      const data = await response.json();
      setExtracted(data.data);
      toast.success("Success", "Information extracted from website");
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Failed to extract");
    } finally {
      setExtracting(false);
    }
  };

  const applyExtracted = () => {
    if (!extracted) return;
    setFormData((prev) => ({
      ...prev,
      email: extracted.email || prev.contactName,
      phone: extracted.phone || prev.phone,
      address: extracted.address || prev.address,
      website: extracted.website || prev.website,
    }));
    toast.success("Success", "Extracted information applied to form");
  };

  const handleUpload = (field: keyof typeof uploads, file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("Error", "File size must be less than 10MB");
      return;
    }
    setUploads((prev) => ({ ...prev, [field]: file }));
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      // Upload files if any
      const uploadedDocs: Record<string, string> = {};
      for (const [field, file] of Object.entries(uploads)) {
        if (file) {
          const formDataObj = new FormData();
          formDataObj.append("file", file);
          formDataObj.append("type", "contractor_credential");

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formDataObj,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            uploadedDocs[field] = uploadData.url;
          }
        }
      }

      // Update contractor profile
      const response = await fetch(`/api/contractor/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...uploadedDocs,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      toast.success("Success", "Profile updated successfully");
      setUploads({ logo: null, licenseDocument: null, insuranceDocument: null });
      loadProfile();
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !authContractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PortalShell role="contractor" identityName={authContractor.companyName} trade={tradeNames.join(", ")}>
      <PortalHeader projectName="ResidenceOS" pageTitle="Profile" />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* My Trades Section */}
          <div className="card">
            <h2 style={{ marginBottom: 8 }}>My Trades</h2>
            <p className="card-meta" style={{ marginBottom: 14 }}>
              Pick the trades you bid. This controls which projects you see and which assets, takeoffs, and selections show up in each project&apos;s scope.
            </p>
            <TradeSelector selectedTradeIds={tradeIds} onTradesChange={setTradeIds} />
            <button
              onClick={saveTrades}
              disabled={savingTrades}
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              {savingTrades && <Loader2 size={16} className="animate-spin" />}
              {savingTrades ? "Saving..." : "Save Trades"}
            </button>
          </div>

          {/* Website Auto-Extract Section */}
          <div className="card">
            <h2 style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Wand2 size={18} strokeWidth={1.8} />
              Auto-Extract Contact Info
            </h2>
            <p className="card-meta" style={{ marginBottom: 14 }}>
              Enter your website URL and we&apos;ll automatically extract your contact information using AI.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourcompany.com"
                style={{ flex: 1 }}
              />
              <button
                onClick={extractFromWebsite}
                disabled={extracting}
                className="btn btn-primary"
              >
                {extracting && <Loader2 size={16} className="animate-spin" />}
                Extract
              </button>
            </div>

            {extracted && (
              <div
                className="card"
                style={{ marginTop: 16, background: "var(--color-accent-100)", borderColor: "var(--color-accent-300)" }}
              >
                <p style={{ fontSize: 13, margin: "0 0 8px" }}>
                  <strong>Found:</strong> {extracted.details}
                </p>
                {extracted.email && (
                  <p style={{ fontSize: 13, margin: "4px 0" }}>Email: {extracted.email}</p>
                )}
                {extracted.phone && (
                  <p style={{ fontSize: 13, margin: "4px 0" }}>Phone: {extracted.phone}</p>
                )}
                {extracted.address && (
                  <p style={{ fontSize: 13, margin: "4px 0" }}>Address: {extracted.address}</p>
                )}
                <button onClick={applyExtracted} className="btn btn-secondary" style={{ marginTop: 8 }}>
                  Apply to Form
                </button>
              </div>
            )}
          </div>

          {/* Contact Information Form */}
          <div className="card">
            <h2 style={{ marginBottom: 14 }}>Contact Information</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                  className="w-full"
                />
              </div>

              <div>
                <label style={labelStyle}>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Credentials Section */}
          <div className="card">
            <h2 style={{ marginBottom: 14 }}>Credentials &amp; Documents</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>License Number</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseNumber: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label style={labelStyle}>License Expiry</label>
                  <input
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseExpiry: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Upload License Document (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) =>
                    handleUpload("licenseDocument", e.target.files?.[0] || null)
                  }
                  className="w-full"
                />
                {profile?.licenseDocument && (
                  <p className="card-meta" style={{ marginTop: 4 }}>
                    Current: {profile.licenseDocument}
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Insurance Expiry</label>
                <input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, insuranceExpiry: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label style={labelStyle}>Upload Insurance Certificate (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) =>
                    handleUpload("insuranceDocument", e.target.files?.[0] || null)
                  }
                  className="w-full"
                />
                {profile?.insuranceDocument && (
                  <p className="card-meta" style={{ marginTop: 4 }}>
                    Current: {profile.insuranceDocument}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveProfile}
            disabled={saving}
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px 16px" }}
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}
    </PortalShell>
  );
}
