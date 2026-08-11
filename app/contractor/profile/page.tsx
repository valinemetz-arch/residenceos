"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Download, Wand2 } from "lucide-react";
import { toast } from "@/lib/toast";

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

export default function ContractorProfile() {
  const router = useRouter();
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/auth/contractor/me");
      if (!response.ok) {
        router.push("/contractor/login");
        return;
      }
      const data = await response.json();
      const contractor = data.data as ContractorProfile;
      setProfile(contractor);
      setFormData({
        contactName: contractor.contactName || "",
        phone: contractor.phone || "",
        address: contractor.address || "",
        website: contractor.website || "",
        licenseNumber: contractor.licenseNumber || "",
        licenseExpiry: contractor.licenseExpiry ? contractor.licenseExpiry.split("T")[0] : "",
        insuranceExpiry: contractor.insuranceExpiry
          ? contractor.insuranceExpiry.split("T")[0]
          : "",
      });
    } catch (error) {
      toast.error("Error", "Failed to load profile");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold dark:text-white mb-8">Company Profile</h1>

        {/* Website Auto-Extract Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Auto-Extract Contact Info
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Enter your website URL and we'll automatically extract your contact information using AI.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={extractFromWebsite}
              disabled={extracting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {extracting && <Loader2 className="h-4 w-4 animate-spin" />}
              Extract
            </button>
          </div>

          {extracted && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Found:</strong> {extracted.details}
              </p>
              {extracted.email && (
                <p className="text-sm dark:text-gray-300">📧 {extracted.email}</p>
              )}
              {extracted.phone && (
                <p className="text-sm dark:text-gray-300">📞 {extracted.phone}</p>
              )}
              {extracted.address && (
                <p className="text-sm dark:text-gray-300">📍 {extracted.address}</p>
              )}
              <button
                onClick={applyExtracted}
                className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Apply to Form
              </button>
            </div>
          )}
        </div>

        {/* Contact Information Form */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold dark:text-white mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourcompany.com"
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Credentials Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold dark:text-white mb-4">Credentials & Documents</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseNumber: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                  License Expiry
                </label>
                <input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseExpiry: e.target.value })
                  }
                  className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Upload License Document (PDF/Image)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) =>
                  handleUpload("licenseDocument", e.target.files?.[0] || null)
                }
                className="w-full"
              />
              {profile?.licenseDocument && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {profile.licenseDocument}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Insurance Expiry
              </label>
              <input
                type="date"
                value={formData.insuranceExpiry}
                onChange={(e) =>
                  setFormData({ ...formData, insuranceExpiry: e.target.value })
                }
                className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                Upload Insurance Certificate (PDF/Image)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) =>
                  handleUpload("insuranceDocument", e.target.files?.[0] || null)
                }
                className="w-full"
              />
              {profile?.insuranceDocument && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
          className="w-full bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
