"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

interface Trade {
  id: string;
  name: string;
}

interface TradeSelectorProps {
  selectedTradeIds: string[];
  onTradesChange: (tradeIds: string[]) => void;
}

export default function TradeSelector({
  selectedTradeIds,
  onTradesChange,
}: TradeSelectorProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  async function fetchTrades() {
    try {
      setLoading(true);
      const response = await fetch("/api/trades");
      if (!response.ok) throw new Error("Failed to fetch trades");
      const data = await response.json();
      setTrades(data.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trades");
    } finally {
      setLoading(false);
    }
  }

  function toggleTrade(tradeId: string) {
    const newIds = selectedTradeIds.includes(tradeId)
      ? selectedTradeIds.filter(id => id !== tradeId)
      : [...selectedTradeIds, tradeId];
    onTradesChange(newIds);
  }

  if (loading) {
    return <div className="text-[#5A5A5A]">Loading trades...</div>;
  }

  if (error) {
    return <div className="text-brand-error">{error}</div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#5A5A5A] dark:text-[#A8A8A8]">
        Select Trades
      </label>
      <div className="grid grid-cols-2 gap-3">
        {trades.map((trade) => (
          <button
            key={trade.id}
            onClick={() => toggleTrade(trade.id)}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition ${
              selectedTradeIds.includes(trade.id)
                ? "border-brand-primary bg-brand-cream dark:bg-brand-charcoal"
                : "border-[#D4D9CE] dark:border-[#1F1F1F] hover:border-brand-primary/40"
            }`}
          >
            {selectedTradeIds.includes(trade.id) ? (
              <CheckCircle2 className="h-5 w-5 text-brand-primary dark:text-brand-secondary" />
            ) : (
              <Circle className="h-5 w-5 text-[#5A5A5A]" />
            )}
            <span className="text-sm font-medium">{trade.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
