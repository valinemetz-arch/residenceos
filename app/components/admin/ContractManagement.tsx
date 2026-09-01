"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Send, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";

interface Bid {
  id: string;
  projectId: string;
  contractorId: string;
  amount: number;
  status: string;
  submittedAt: string;
  includesInstallation: boolean | null;
  installEstimate: string | null;
  project: {
    id: string;
    name: string;
    address?: string;
  };
  contractor: {
    id: string;
    email: string;
    companyName: string;
    contactName?: string;
  };
  contract?: {
    id: string;
    status: string;
    sentAt: string;
  };
}

interface SendContractModal {
  bid: Bid;
  projectDetails: {
    projectName: string;
    tradeService: string;
    contractAmount: number;
    lotNumber?: string;
    startDate?: string;
    completionDate?: string;
  };
}

export default function ContractManagement() {
  const [approvedBids, setApprovedBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingContractId, setSendingContractId] = useState<string | null>(null);
  const [modalData, setModalData] = useState<SendContractModal | null>(null);

  useEffect(() => {
    loadApprovedBids();
  }, []);

  const loadApprovedBids = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bids?status=approved");

      if (response.ok) {
        const data = await response.json();
        setApprovedBids(data.data || []);
      } else {
        toast.error("Error", "Failed to load bids");
      }
    } catch (error) {
      console.error("Error loading bids:", error);
      toast.error("Error", "Failed to load bids");
    } finally {
      setLoading(false);
    }
  };

  const handleSendContractClick = (bid: Bid) => {
    setModalData({
      bid,
      projectDetails: {
        projectName: bid.project.name,
        tradeService: "General Construction",
        contractAmount: bid.amount,
        lotNumber: "",
        startDate: "",
        completionDate: "",
      },
    });
  };

  const handleSendContract = async () => {
    if (!modalData) return;

    try {
      setSendingContractId(modalData.bid.id);

      const response = await fetch("/api/contracts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: modalData.bid.projectId,
          contractorId: modalData.bid.contractorId,
          contractorEmail: modalData.bid.contractor.email,
          contractorName:
            modalData.bid.contractor.contactName ||
            modalData.bid.contractor.companyName,
          projectDetails: modalData.projectDetails,
        }),
      });

      if (response.ok) {
        toast.success("Success", "Contract sent successfully");
        setModalData(null);
        await loadApprovedBids();
      } else {
        const error = await response.json();
        toast.error("Error", error.message || "Failed to send contract");
      }
    } catch (error) {
      console.error("Error sending contract:", error);
      toast.error("Error", "Failed to send contract");
    } finally {
      setSendingContractId(null);
    }
  };

  const bidsWithoutContracts = approvedBids.filter((b) => !b.contract);
  const bidsWithContracts = approvedBids.filter((b) => b.contract);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Contracts to Send */}
      {bidsWithoutContracts.length > 0 && (
        <div className="bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-brand-warning" />
            <h2 className="text-xl font-bold dark:text-white">
              Contracts to Send ({bidsWithoutContracts.length})
            </h2>
          </div>

          <div className="space-y-3">
            {bidsWithoutContracts.map((bid) => (
              <div
                key={bid.id}
                className="flex justify-between items-center p-4 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg hover:bg-brand-cream dark:hover:bg-brand-charcoal transition"
              >
                <div className="flex-1">
                  <h3 className="font-semibold dark:text-white">
                    {bid.contractor.companyName}
                  </h3>
                  <p className="text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                    {bid.project.name} - ${bid.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#5A5A5A] dark:text-[#A8A8A8] mt-1">
                    {bid.contractor.email}
                  </p>
                  <p className="text-xs text-[#5A5A5A] dark:text-[#A8A8A8] mt-1">
                    {bid.includesInstallation === false
                      ? "Excludes installation"
                      : bid.includesInstallation === true
                      ? "Includes installation"
                      : "Installation not specified"}
                    {bid.installEstimate ? ` · Est. install time: ${bid.installEstimate}` : ""}
                  </p>
                </div>

                <button
                  onClick={() => handleSendContractClick(bid)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg transition font-medium"
                  disabled={sendingContractId === bid.id}
                >
                  {sendingContractId === bid.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sendingContractId === bid.id ? "Sending..." : "Send Contract"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Contracts */}
      {bidsWithContracts.length > 0 && (
        <div className="bg-white dark:bg-[#2D2D2D] rounded-lg border border-[#D4D9CE] dark:border-[#1F1F1F] p-6">
          <h2 className="text-xl font-bold dark:text-white mb-4">
            Contracts Sent ({bidsWithContracts.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D4D9CE] dark:border-[#1F1F1F]">
                  <th className="px-4 py-3 text-left font-semibold dark:text-[#A8A8A8]">
                    Contractor
                  </th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-[#A8A8A8]">
                    Project
                  </th>
                  <th className="px-4 py-3 text-right font-semibold dark:text-[#A8A8A8]">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-[#A8A8A8]">
                    Installation
                  </th>
                  <th className="px-4 py-3 text-center font-semibold dark:text-[#A8A8A8]">
                    Contract Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold dark:text-[#A8A8A8]">
                    Sent Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {bidsWithContracts.map((bid) => (
                  <tr
                    key={bid.id}
                    className="border-b border-[#D4D9CE] dark:border-[#1F1F1F] hover:bg-brand-cream dark:hover:bg-brand-charcoal"
                  >
                    <td className="px-4 py-3 dark:text-[#A8A8A8]">
                      {bid.contractor.companyName}
                    </td>
                    <td className="px-4 py-3 dark:text-[#A8A8A8]">
                      {bid.project.name}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold dark:text-white">
                      ${bid.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-[#A8A8A8]">
                      {bid.includesInstallation === false
                        ? "Excluded"
                        : bid.includesInstallation === true
                        ? "Included"
                        : "Not specified"}
                      {bid.installEstimate ? ` (${bid.installEstimate})` : ""}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                          bid.contract?.status === "signed" ||
                          bid.contract?.status === "completed"
                            ? "bg-brand-success/10 text-brand-success dark:bg-brand-success/25 dark:text-brand-success"
                            : "bg-brand-warning/10 text-brand-warning dark:bg-brand-warning/25 dark:text-brand-warning"
                        }`}
                      >
                        {bid.contract?.status === "signed" ||
                        bid.contract?.status === "completed" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : null}
                        {bid.contract?.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#5A5A5A] dark:text-[#A8A8A8]">
                      {bid.contract?.sentAt
                        ? new Date(bid.contract.sentAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {approvedBids.length === 0 && (
        <div className="text-center py-12 text-[#5A5A5A] dark:text-[#A8A8A8]">
          <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No approved bids. Approve bids to send contracts.</p>
        </div>
      )}

      {/* Send Contract Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-[#2D2D2D] rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-2xl font-bold dark:text-white mb-4">
              Send Contract
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium dark:text-[#A8A8A8] mb-2">
                  Contractor
                </label>
                <p className="text-[#5A5A5A] dark:text-[#A8A8A8]">
                  {modalData.bid.contractor.companyName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-[#A8A8A8] mb-2">
                  Project
                </label>
                <p className="text-[#5A5A5A] dark:text-[#A8A8A8]">
                  {modalData.projectDetails.projectName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-[#A8A8A8] mb-2">
                  Trade/Service
                </label>
                <input
                  type="text"
                  value={modalData.projectDetails.tradeService}
                  onChange={(e) =>
                    setModalData({
                      ...modalData,
                      projectDetails: {
                        ...modalData.projectDetails,
                        tradeService: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg dark:bg-brand-charcoal dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-[#A8A8A8] mb-2">
                  Contract Amount
                </label>
                <p className="text-[#5A5A5A] dark:text-[#A8A8A8]">
                  ${modalData.projectDetails.contractAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalData(null)}
                className="flex-1 px-4 py-2 border border-[#D4D9CE] dark:border-[#1F1F1F] rounded-lg hover:bg-brand-cream dark:hover:bg-brand-charcoal transition font-medium dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSendContract}
                disabled={sendingContractId !== null}
                className="flex-1 px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg disabled:bg-brand-gray transition font-medium flex items-center justify-center gap-2"
              >
                {sendingContractId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sendingContractId ? "Sending..." : "Send Contract"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
