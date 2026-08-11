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
    return <div className="text-gray-500">Loading trades...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Trades
      </label>
      <div className="grid grid-cols-2 gap-3">
        {trades.map((trade) => (
          <button
            key={trade.id}
            onClick={() => toggleTrade(trade.id)}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition ${
              selectedTradeIds.includes(trade.id)
                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
            }`}
          >
            {selectedTradeIds.includes(trade.id) ? (
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm font-medium">{trade.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
