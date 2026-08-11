"use client";

import { useEffect, useState } from "react";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { toast } from "@/lib/toast";

interface Message {
  id: string;
  projectId: string;
  contractorId?: string;
  senderType: "contractor" | "owner";
  senderName?: string;
  message: string;
  createdAt: string;
  contractor?: { companyName: string };
}

interface ProjectMessagingProps {
  projectId: string;
}

export default function ProjectMessaging({ projectId }: ProjectMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      await loadMessages();
    } catch (error) {
      toast.error("Error", error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Project Q&A
      </h2>

      {/* Messages Container */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No messages yet. Start asking questions about the project!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderType === "contractor" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderType === "contractor"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-none"
                }`}
              >
                <p className="text-xs font-semibold mb-1 opacity-75">
                  {msg.senderName || "Unknown"}
                </p>
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-60 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ask a question or provide an update..."
          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-3 py-2 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
