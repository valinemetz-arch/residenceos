import { classicalFontVariables } from "@/lib/classicalFonts";
import { PortalSidebar } from "./PortalSidebar";

interface PortalShellProps {
  role: "contractor" | "homeowner";
  identityName: string;
  trade?: string | null;
  children: React.ReactNode;
}

export function PortalShell({ role, identityName, trade, children }: PortalShellProps) {
  return (
    <div
      className={`classical ${classicalFontVariables}`}
      style={{ display: "flex", minHeight: "100vh" }}
    >
      <PortalSidebar role={role} identityName={identityName} trade={trade} />
      <div style={{ flex: 1, overflow: "auto", padding: "36px 44px 40px", boxSizing: "border-box" }}>
        {children}
      </div>
    </div>
  );
}
