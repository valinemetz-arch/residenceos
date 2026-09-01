"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/lib/toast";

interface ContractSigningModalProps {
  isOpen: boolean;
  contractId: string;
  envelopeId: string;
  signingUrl: string;
  contractorName: string;
  projectName: string;
  onClose: () => void;
  onSigned?: () => void;
}

export default function ContractSigningModal({
  isOpen,
  contractId,
  envelopeId,
  signingUrl,
  contractorName,
  projectName,
  onClose,
  onSigned,
}: ContractSigningModalProps) {
  const [status, setStatus] = useState<string>("sent");
  const [isLoading, setIsLoading] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    if (!isOpen || isSigned) return;

    // Check contract status every 5 seconds for up to 2 minutes
    const interval = setInterval(async () => {
      if (checkCount > 24) {
        // Stop after 2 minutes
        clearInterval(interval);
        return;
      }

      try {
        const response = await fetch(
          `/api/contracts/${envelopeId}/status`
        );

        if (response.ok) {
          const data = await response.json();
          setStatus(data.data.status);

          if (
            data.data.status === "signed" ||
            data.data.status === "completed"
          ) {
            setIsSigned(true);
            clearInterval(interval);
            toast.success("Success", "Contract signed successfully!");
            onSigned?.();
          }
        }
      } catch (error) {
        console.error("Failed to check contract status:", error);
      }

      setCheckCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, envelopeId, isSigned, onSigned, checkCount]);

  if (!isOpen) return null;

  return (
    <div
      className="classical"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32,31,29,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "var(--color-bg)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          maxWidth: 560,
          width: "100%",
          margin: "0 16px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "28px 30px 20px",
            borderBottom: "1px solid var(--color-divider)",
            background: "var(--color-bg)",
          }}
        >
          <div>
            <h2 style={{ fontSize: 22 }}>Sign Contract</h2>
            <p className="card-meta" style={{ marginTop: 4 }}>{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 30px 28px" }}>
          {isSigned ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle
                size={48}
                strokeWidth={1.5}
                style={{ color: "var(--color-accent-700)", margin: "0 auto 16px" }}
              />
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>
                Contract Signed Successfully
              </h3>
              <p className="card-meta" style={{ marginBottom: 20 }}>
                Your contract has been signed and is now part of your records.
              </p>
              <button onClick={onClose} className="btn btn-primary">
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Status Bar */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div className="card-kicker">Contract Status</div>
                    <p style={{ fontSize: 16, fontWeight: 600, marginTop: 4, textTransform: "capitalize" }}>
                      {status}
                    </p>
                  </div>
                  {isLoading && (
                    <Loader2 size={18} className="animate-spin" style={{ color: "var(--color-accent-700)" }} />
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 8 }}>How to sign:</h3>
                <ol className="card-meta" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.7 }}>
                  <li>Click the "Sign Now" button below</li>
                  <li>A new window will open with the DocuSign interface</li>
                  <li>Review the contract carefully</li>
                  <li>Sign on the designated signature field</li>
                  <li>Complete the signing process</li>
                </ol>
              </div>

              {/* iFrame or Redirect Option */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    window.open(signingUrl, "_blank");
                    setIsLoading(false);
                  }}
                  disabled={isLoading || isSigned}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ExternalLink size={16} strokeWidth={1.8} />
                  )}
                  Sign Now in DocuSign
                </button>

                <p className="card-meta" style={{ textAlign: "center" }}>
                  A new window will open for secure signing
                </p>
              </div>

              {/* Auto-refresh Note */}
              <div className="card" style={{ marginTop: 20 }}>
                <p className="card-meta">
                  This page will automatically update when you complete signing.
                  Keep this window open during the process.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
