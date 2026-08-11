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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">
              Sign Contract
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Close"
          >
            <X className="h-6 w-6 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSigned ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold dark:text-white mb-2">
                Contract Signed Successfully
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your contract has been signed and is now part of your records.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Status Bar */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      Contract Status
                    </p>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-200 mt-1 capitalize">
                      {status}
                    </p>
                  </div>
                  {isLoading && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold dark:text-white mb-2">
                  How to sign:
                </h3>
                <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Click the "Sign Now" button below</li>
                  <li>A new window will open with the DocuSign interface</li>
                  <li>Review the contract carefully</li>
                  <li>Sign on the designated signature field</li>
                  <li>Complete the signing process</li>
                </ol>
              </div>

              {/* iFrame or Redirect Option */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setIsLoading(true);
                    window.open(signingUrl, "_blank");
                    setIsLoading(false);
                  }}
                  disabled={isLoading || isSigned}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Sign Now in DocuSign
                </button>

                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  A new window will open for secure signing
                </p>
              </div>

              {/* Auto-refresh Note */}
              <div className="mt-6 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
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
