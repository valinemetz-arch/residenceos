"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Image as ImageIcon,
  FolderOpen,
  MessageSquare,
  LayoutGrid,
  Package,
  DollarSign,
  ShieldCheck,
  Settings2,
  FileText,
  Briefcase,
  Gavel,
  FileCheck,
  UserCog,
  BookOpen,
  Users,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const HOMEOWNER_PRIMARY: NavItem[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/app/photos", label: "Photos", icon: ImageIcon },
  { href: "/app/project", label: "Project", icon: FolderOpen },
  { href: "/app/messages", label: "Messages", icon: MessageSquare },
];

const HOMEOWNER_SECONDARY: NavItem[] = [
  { href: "/app/reference", label: "Field Reference", icon: BookOpen },
  { href: "/app/trade-access", label: "Trade Access", icon: Users },
  { href: "/app/spaces", label: "Spaces", icon: LayoutGrid },
  { href: "/app/assets", label: "Assets", icon: Package },
  { href: "/app/budget", label: "Budget", icon: DollarSign },
  { href: "/app/warranties", label: "Warranties", icon: ShieldCheck },
  { href: "/app/systems", label: "Systems", icon: Settings2 },
  { href: "/app/reports", label: "Reports", icon: FileText },
];

const CONTRACTOR_PRIMARY: NavItem[] = [
  { href: "/contractor", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/contractor/reference", label: "Field Reference", icon: BookOpen },
  { href: "/contractor/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/contractor/photos", label: "Photos", icon: ImageIcon },
  { href: "/contractor/project", label: "Project", icon: FolderOpen },
  { href: "/contractor/messages", label: "Messages", icon: MessageSquare },
];

const CONTRACTOR_SECONDARY: NavItem[] = [
  { href: "/contractor/available-projects", label: "Available Projects", icon: Briefcase },
  { href: "/contractor/bids", label: "Bids", icon: Gavel },
  { href: "/contractor/contracts", label: "Contracts", icon: FileCheck },
  { href: "/contractor/profile", label: "Profile", icon: UserCog },
];

interface PortalSidebarProps {
  role: "contractor" | "homeowner";
  /** Company name (contractor) or household name (homeowner). */
  identityName: string;
  /** Contractor's trade label, e.g. "Electrical" - omit for homeowners. */
  trade?: string | null;
}

export function PortalSidebar({ role, identityName, trade }: PortalSidebarProps) {
  const pathname = usePathname();
  const isContractor = role === "contractor";
  const primary = isContractor ? CONTRACTOR_PRIMARY : HOMEOWNER_PRIMARY;
  const secondary = isContractor ? CONTRACTOR_SECONDARY : HOMEOWNER_SECONDARY;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div
      className="classical"
      style={{
        width: 236,
        flexShrink: 0,
        borderRight: "1px solid var(--color-divider)",
        display: "flex",
        flexDirection: "column",
        padding: "22px 14px",
        boxSizing: "border-box",
        height: "100%",
      }}
    >
      <div style={{ padding: "0 10px 18px" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 19, fontWeight: 600 }}>
          ResidenceOS
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-accent-700)",
            marginTop: 2,
          }}
        >
          {isContractor ? "Contractor Portal" : "Owner Dashboard"}
        </div>
      </div>
      <div className="hr" style={{ margin: "0 0 14px" }} />

      <NavGroup items={primary} isActive={isActive} />

      <div className="hr" style={{ margin: "14px 0" }} />

      <NavGroup items={secondary} isActive={isActive} />

      <div style={{ flex: 1 }} />

      <div className="hr" style={{ margin: "14px 0" }} />
      <div style={{ padding: "0 10px" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{identityName}</div>
        {isContractor && trade ? (
          <span className="tag tag-accent" style={{ marginTop: 6, display: "inline-block" }}>
            {trade} trade
          </span>
        ) : !isContractor ? (
          <span className="tag tag-outline" style={{ marginTop: 6, display: "inline-block" }}>
            View only
          </span>
        ) : null}
      </div>
    </div>
  );
}

function NavGroup({
  items,
  isActive,
}: {
  items: NavItem[];
  isActive: (item: NavItem) => boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="portal-navbtn"
            data-active={isActive(item)}
          >
            <Icon size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
