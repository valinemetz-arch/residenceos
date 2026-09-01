"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Trash2, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { RequireAdmin } from "@/app/components/admin/RequireAdmin";

interface TimelineStep {
  id: string;
  label: string;
  dateLabel: string;
  order: number;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  order: number;
}

interface HouseProject {
  id: string;
  name: string;
  gateCode: string | null;
  phase: string | null;
  timelineSteps: TimelineStep[];
  contacts: Contact[];
}

export default function AdminSiteInfoPage() {
  const [project, setProject] = useState<HouseProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gateCode, setGateCode] = useState("");
  const [phase, setPhase] = useState("");
  const [newStep, setNewStep] = useState({ label: "", dateLabel: "" });
  const [newContact, setNewContact] = useState({ name: "", role: "", phone: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/projects/house");
    const data = await res.json();
    if (data.success) {
      setProject(data.data);
      setGateCode(data.data.gateCode || "");
      setPhase(data.data.phase || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveBasics = async () => {
    if (!project) return;
    setSaving(true);
    try {
      await authFetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateCode: gateCode || null, phase: phase || null }),
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const addStep = async () => {
    if (!project || !newStep.label.trim() || !newStep.dateLabel.trim()) return;
    await authFetch(`/api/projects/${project.id}/timeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newStep, order: project.timelineSteps.length }),
    });
    setNewStep({ label: "", dateLabel: "" });
    await load();
  };

  const deleteStep = async (stepId: string) => {
    if (!project) return;
    await authFetch(`/api/projects/${project.id}/timeline/${stepId}`, { method: "DELETE" });
    await load();
  };

  const addContact = async () => {
    if (!project || !newContact.name.trim() || !newContact.role.trim() || !newContact.phone.trim()) return;
    await authFetch(`/api/projects/${project.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newContact, order: project.contacts.length }),
    });
    setNewContact({ name: "", role: "", phone: "" });
    await load();
  };

  const deleteContact = async (contactId: string) => {
    if (!project) return;
    await authFetch(`/api/projects/${project.id}/contacts/${contactId}`, { method: "DELETE" });
    await load();
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#2D2D2D]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-brand-primary dark:text-brand-secondary hover:underline mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
            <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
              <MapPin className="h-8 w-8" />
              Site Info
            </h1>
            <p className="text-[#5A5A5A] dark:text-[#A8A8A8] mt-2">
              Gate code, construction phase, timeline and contacts shown in the Owner Dashboard and Contractor Portal.
            </p>
          </div>

          {loading || !project ? (
            <div className="text-center py-12 text-[#5A5A5A] dark:text-[#A8A8A8]">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Gate Code / Phase */}
              <div className="bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] p-6">
                <h2 className="text-lg font-semibold text-brand-charcoal dark:text-white mb-4">
                  {project.name}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
                      Gate Code
                    </label>
                    <input
                      type="text"
                      value={gateCode}
                      onChange={(e) => setGateCode(e.target.value)}
                      placeholder="e.g. 4471 #"
                      className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8] mb-1">
                      Current Phase
                    </label>
                    <input
                      type="text"
                      value={phase}
                      onChange={(e) => setPhase(e.target.value)}
                      placeholder="e.g. Framing & Rough-In"
                      className="w-full px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={saveBasics}
                  disabled={saving}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:bg-brand-gray text-white rounded-lg font-medium"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              {/* Timeline */}
              <div className="bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] p-6">
                <h2 className="text-lg font-semibold text-brand-charcoal dark:text-white mb-4">Timeline</h2>
                <div className="divide-y divide-[#D4D9CE] dark:divide-[#1F1F1F] mb-4">
                  {project.timelineSteps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-brand-charcoal dark:text-white">{step.label}</p>
                        <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">{step.dateLabel}</p>
                      </div>
                      <button
                        onClick={() => deleteStep(step.id)}
                        className="p-2 rounded hover:bg-brand-error/10 text-brand-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {project.timelineSteps.length === 0 && (
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8] py-3">No timeline steps yet.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStep.label}
                    onChange={(e) => setNewStep({ ...newStep, label: e.target.value })}
                    placeholder="Label, e.g. Framing"
                    className="flex-1 px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
                  />
                  <input
                    type="text"
                    value={newStep.dateLabel}
                    onChange={(e) => setNewStep({ ...newStep, dateLabel: e.target.value })}
                    placeholder="Date/status, e.g. Sep 2026"
                    className="flex-1 px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
                  />
                  <button
                    onClick={addStep}
                    className="px-3 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contacts */}
              <div className="bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] p-6">
                <h2 className="text-lg font-semibold text-brand-charcoal dark:text-white mb-4">Contacts</h2>
                <div className="divide-y divide-[#D4D9CE] dark:divide-[#1F1F1F] mb-4">
                  {project.contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-brand-charcoal dark:text-white">{c.name}</p>
                        <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                          {c.role} · {c.phone}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteContact(c.id)}
                        className="p-2 rounded hover:bg-brand-error/10 text-brand-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {project.contacts.length === 0 && (
                    <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8] py-3">No contacts yet.</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="Name"
                    className="px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
                  />
                  <input
                    type="text"
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    placeholder="Role, e.g. General Contractor"
                    className="px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="Phone"
                      className="flex-1 px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg bg-white dark:bg-[#2D2D2D] text-brand-charcoal dark:text-white"
                    />
                    <button
                      onClick={addContact}
                      className="px-3 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireAdmin>
  );
}
