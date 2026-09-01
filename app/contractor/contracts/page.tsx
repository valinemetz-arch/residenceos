"use client";

import { Loader2 } from "lucide-react";
import { PortalShell } from "@/app/components/portal/PortalShell";
import { PortalHeader } from "@/app/components/portal/PortalHeader";
import { useContractorAuth } from "@/app/components/portal/useContractorAuth";
import ContractorsContracts from "@/app/components/contractor/ContractorsContracts";

export default function ContractorContractsPage() {
  const { loading: authLoading, contractor, tradeNames } = useContractorAuth();

  if (authLoading || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <PortalShell role="contractor" identityName={contractor.companyName} trade={tradeNames.join(", ")}>
      <PortalHeader projectName="ResidenceOS" pageTitle="Contracts" />
      <ContractorsContracts contractorId={contractor.id} />
    </PortalShell>
  );
}
