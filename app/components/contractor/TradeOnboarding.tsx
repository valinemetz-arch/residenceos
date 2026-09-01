"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import TradeSelector from "@/app/components/admin/TradeSelector";
import { toast } from "@/lib/toast";

interface TradeOnboardingProps {
  companyName: string;
  onDone: () => void;
}

export default function TradeOnboarding({ companyName, onDone }: TradeOnboardingProps) {
  const [tradeIds, setTradeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (tradeIds.length === 0) {
      toast.error("Error", "Please select at least one trade");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/contractor/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeIds }),
      });
      if (!response.ok) throw new Error("Failed to save trades");
      onDone();
    } catch (error) {
      toast.error("Error", "Failed to save your trades");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#2D2D2D] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] p-8">
        <h1 className="text-2xl font-bold dark:text-white mb-2">
          Welcome, {companyName}
        </h1>
        <p className="text-[#5A5A5A] dark:text-[#A8A8A8] mb-6">
          Select the trades you want to bid. You&apos;ll only see projects and scope of work (assets, takeoffs, selections) for the trades you pick — you can change this anytime from your profile.
        </p>
        <TradeSelector selectedTradeIds={tradeIds} onTradesChange={setTradeIds} />
        <button
          onClick={handleContinue}
          disabled={saving}
          className="mt-6 w-full bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-50 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
