import { PortalShell } from "@/app/components/portal/PortalShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalShell role="homeowner" identityName="Nemetz Family">
      {children}
    </PortalShell>
  );
}
