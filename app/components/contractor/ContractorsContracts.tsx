"use client";

import { useEffect, useState } from "react";
import { FileText, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";
import ContractSigningModal from "@/app/components/ContractSigningModal";

interface ProjectDetails {
  projectName: string;
  tradeService: string;
  contractAmount: number;
  startDate?: string;
  completionDate?: string;
}

interface Contract {
  id: string;
  envelopeId: string;
  signingUrl: string;
  signerName: string;
  signerEmail: string;
  status: string;
  sentAt: string;
  signedAt?: string;
  completedAt?: string;
  documentUrl?: string;
  projectDetails: ProjectDetails;
  project?: {
    id: string;
    name: string;
  };
}

interface ContractorsContractsProps {
  contractorId: string;
}

export default function ContractorsContracts({
  contractorId,
}: ContractorsContractsProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadContracts();
  }, [contractorId]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/contracts/contractor/${contractorId}`
      );

      if (response.ok) {
        const data = await response.json();
        setContracts(data.data || []);
      } else {
        toast.error("Error", "Failed to load contracts");
      }
    } catch (error) {
      console.error("Error loading contracts:", error);
      toast.error("Error", "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  const handleSignClick = (contract: Contract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleContractSigned = async () => {
    setIsModalOpen(false);
    await loadContracts();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      sent: {
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
        icon: <FileText className="h-4 w-4" />,
        label: "Sent",
      },
      viewed: {
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
        icon: <Clock className="h-4 w-4" />,
        label: "Viewed",
      },
      signed: {
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
        icon: <CheckCircle className="h-4 w-4" />,
        label: "Signed",
      },
      completed: {
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
        icon: <CheckCircle className="h-4 w-4" />,
        label: "Completed",
      },
      voided: {
        color:
          "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Voided",
      },
    };

    const config = statusConfig[status] || statusConfig.sent;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 w-fit ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No contracts at this time.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  {(contract.projectDetails as ProjectDetails)?.projectName ||
                    contract.project?.name ||
                    "Contract"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {(contract.projectDetails as ProjectDetails)?.tradeService}
                </p>
              </div>
              {getStatusBadge(contract.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Contract Amount
                </p>
                <p className="text-lg font-semibold dark:text-white">
                  ${(contract.projectDetails as ProjectDetails)?.contractAmount?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Sent Date
                </p>
                <p className="text-lg font-semibold dark:text-white">
                  {new Date(contract.sentAt).toLocaleDateString()}
                </p>
              </div>
              {contract.signedAt && (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Signed Date
                  </p>
                  <p className="text-lg font-semibold dark:text-white">
                    {new Date(contract.signedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {contract.status === "sent" && (
                <button
                  onClick={() => handleSignClick(contract)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <FileText className="h-4 w-4" />
                  Sign Contract
                </button>
              )}

              {contract.status === "signed" ||
                (contract.status === "completed" && (
                  <button
                    onClick={() => window.open(contract.documentUrl, "_blank")}
                    disabled={!contract.documentUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Download Signed PDF
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {selectedContract && (
        <ContractSigningModal
          isOpen={isModalOpen}
          contractId={selectedContract.id}
          envelopeId={selectedContract.envelopeId}
          signingUrl={selectedContract.signingUrl}
          contractorName={selectedContract.signerName}
          projectName={
            (selectedContract.projectDetails as ProjectDetails)?.projectName ||
            selectedContract.project?.name ||
            "Contract"
          }
          onClose={() => setIsModalOpen(false)}
          onSigned={handleContractSigned}
        />
      )}
    </>
  );
}
