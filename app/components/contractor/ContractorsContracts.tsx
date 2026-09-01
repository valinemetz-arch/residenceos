"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
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

const STATUS_LABEL: Record<string, string> = {
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  completed: "Completed",
  voided: "Voided",
};

const STATUS_CLASS: Record<string, string> = {
  sent: "tag tag-outline",
  viewed: "tag tag-outline",
  signed: "tag tag-neutral",
  completed: "tag tag-neutral",
  voided: "tag tag-accent",
};

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

  const getStatusTag = (status: string) => (
    <span className={STATUS_CLASS[status] || "tag tag-outline"}>
      {STATUS_LABEL[status] || status}
    </span>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 32 }}>
        <FileText className="h-12 w-12 mx-auto mb-4" style={{ opacity: 0.5 }} />
        <p className="card-meta">No contracts at this time.</p>
      </div>
    );
  }

  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Sent</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => {
            const details = contract.projectDetails as ProjectDetails;
            const projectName =
              details?.projectName || contract.project?.name || "Contract";

            return (
              <tr key={contract.id}>
                <td>
                  <div className="card-title" style={{ fontSize: 14 }}>
                    {projectName}
                  </div>
                  {details?.tradeService && (
                    <div className="card-meta" style={{ marginTop: 2 }}>
                      {details.tradeService}
                    </div>
                  )}
                </td>
                <td>${details?.contractAmount?.toLocaleString()}</td>
                <td>{getStatusTag(contract.status)}</td>
                <td>{new Date(contract.sentAt).toLocaleDateString()}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {contract.status === "sent" && (
                      <button
                        onClick={() => handleSignClick(contract)}
                        className="btn btn-primary"
                      >
                        <FileText size={14} strokeWidth={1.8} />
                        Sign Contract
                      </button>
                    )}

                    {contract.status === "signed" ||
                      (contract.status === "completed" && (
                        <button
                          onClick={() => window.open(contract.documentUrl, "_blank")}
                          disabled={!contract.documentUrl}
                          className="btn"
                        >
                          <Download size={14} strokeWidth={1.8} />
                          Download Signed PDF
                        </button>
                      ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
