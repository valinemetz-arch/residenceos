"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
  /** Whose "sent" bubbles render right-aligned. Defaults to "contractor" to
   * match the original contractor bid-page usage. */
  viewerType?: "contractor" | "owner";
  /** Scopes the thread to one contractor's private conversation with the GC. */
  contractorId?: string;
  /** Homeowners can read every thread but not post (per the design handoff). */
  readOnly?: boolean;
}

export default function ProjectMessaging({
  projectId,
  viewerType = "contractor",
  contractorId,
  readOnly = false,
}: ProjectMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [projectId, contractorId]);

  const loadMessages = async () => {
    try {
      const params = new URLSearchParams({ projectId });
      if (contractorId) params.set("contractorId", contractorId);
      const response = await fetch(`/api/messages?${params}`);
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
    <div className="classical" style={{ maxWidth: 640, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <p className="card-meta" style={{ textAlign: "center", padding: "32px 0" }}>
            No messages yet.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderType === viewerType;
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "78%",
                    border: `1px solid ${mine ? "var(--color-accent-500)" : "var(--color-divider)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: "10px 14px",
                    background: mine ? "var(--color-accent-100)" : "var(--color-neutral-100)",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent-700)", marginBottom: 3 }}>
                    {msg.senderName || (msg.senderType === "contractor" ? msg.contractor?.companyName : "Owner") || "Unknown"}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.message}</div>
                  <div style={{ fontSize: 11, color: "var(--color-neutral-600)", marginTop: 4 }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: 14 }}>
        {readOnly ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-neutral-700)" }}>
            You have view-only access to this thread.
          </p>
        ) : (
          <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message the GC…"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : "Send"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
