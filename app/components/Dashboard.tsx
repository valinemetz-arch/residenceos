import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getDashboardStats() {
  const [users, spaces, assets, tasks, budgetItems, warranties, systems] = await Promise.all([
    prisma.user.count(),
    prisma.space.count(),
    prisma.asset.count(),
    prisma.task.count(),
    prisma.budgetItem.count(),
    prisma.warranty.count(),
    prisma.system.count(),
  ]);

  return { users, spaces, assets, tasks, budgetItems, warranties, systems };
}

export async function Dashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="rounded-xl border border-[#D4D9CE] dark:border-[#2D2D2D] bg-gradient-to-r from-[#2D5016]/5 via-[#C9A876]/5 to-[#8B6F47]/5 dark:from-[#2D5016]/20 dark:via-[#C9A876]/20 dark:to-[#8B6F47]/20 p-10 shadow-sm">
        <h1 className="font-[Georgia,Garamond,serif] text-4xl font-bold text-[#2D5016] dark:text-[#C9A876] mb-4 leading-tight">
          Welcome to Paseo de Caballo
        </h1>
        <p className="text-lg text-[#5A5A5A] dark:text-[#A8A8A8] leading-relaxed letter-spacing-wide">
          Your complete property management workspace — from spaces and assets to tasks and warranty tracking.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spaces"
          value={stats.spaces}
          icon="🏠"
          href="/app/spaces"
          description="Rooms & areas"
          color="primary"
        />
        <StatCard
          label="Assets"
          value={stats.assets}
          icon="🔧"
          href="/app/assets"
          description="Installed products"
          color="secondary"
        />
        <StatCard
          label="Tasks"
          value={stats.tasks}
          icon="✓"
          href="/app/tasks"
          description="Work items"
          color="accent"
        />
        <StatCard
          label="Systems"
          value={stats.systems}
          icon="⚙️"
          href="/app/systems"
          description="Building systems"
          color="primary"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          label="Budget Items"
          value={stats.budgetItems}
          icon="💰"
          href="/app/budget"
          description="Cost tracking"
          color="secondary"
        />
        <StatCard
          label="Warranties"
          value={stats.warranties}
          icon="🛡️"
          href="/app/warranties"
          description="Coverage & protection"
          color="accent"
        />
        <StatCard
          label="Users"
          value={stats.users}
          icon="👥"
          description="Team members"
          color="primary"
        />
      </div>

      {/* Quick Start Guide */}
      <div className="rounded-xl border border-[#D4D9CE] dark:border-[#2D2D2D] bg-white dark:bg-[#1F1F1F] p-10 shadow-sm">
        <h2 className="font-[Georgia,Garamond,serif] text-3xl font-bold text-[#2D5016] dark:text-[#C9A876] mb-8 leading-tight">
          Quick Start
        </h2>
        <div className="grid md:grid-cols-3 gap-8 text-sm">
          <div className="flex gap-4">
            <div className="text-3xl flex-shrink-0">1️⃣</div>
            <div>
              <p className="font-[Georgia,Garamond,serif] font-bold text-[#2D5016] dark:text-[#C9A876] text-base">Create Spaces</p>
              <p className="text-[#5A5A5A] dark:text-[#A8A8A8] text-sm mt-2 letter-spacing-wide">Define your rooms & areas</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-3xl flex-shrink-0">2️⃣</div>
            <div>
              <p className="font-[Georgia,Garamond,serif] font-bold text-[#2D5016] dark:text-[#C9A876] text-base">Add Assets</p>
              <p className="text-[#5A5A5A] dark:text-[#A8A8A8] text-sm mt-2 letter-spacing-wide">Track your products & equipment</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-3xl flex-shrink-0">3️⃣</div>
            <div>
              <p className="font-[Georgia,Garamond,serif] font-bold text-[#2D5016] dark:text-[#C9A876] text-base">Manage Warranties</p>
              <p className="text-[#5A5A5A] dark:text-[#A8A8A8] text-sm mt-2 letter-spacing-wide">Never miss coverage again</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
  description,
  color = "primary"
}: {
  label: string;
  value: number;
  icon: string;
  href?: string;
  description?: string;
  color?: "primary" | "secondary" | "accent";
}) {
  const colorStyles = {
    primary: {
      border: "border-[#2D5016]/20",
      darkBorder: "dark:border-[#C9A876]/20",
      bg: "bg-[#2D5016]/5",
      darkBg: "dark:bg-[#C9A876]/10",
      label: "text-[#2D5016]",
      darkLabel: "dark:text-[#C9A876]",
      value: "text-[#2D5016]",
      darkValue: "dark:text-[#C9A876]",
    },
    secondary: {
      border: "border-[#C9A876]/20",
      darkBorder: "dark:border-[#C9A876]/20",
      bg: "bg-[#C9A876]/5",
      darkBg: "dark:bg-[#C9A876]/10",
      label: "text-[#8B6F47]",
      darkLabel: "dark:text-[#D9B896]",
      value: "text-[#8B6F47]",
      darkValue: "dark:text-[#D9B896]",
    },
    accent: {
      border: "border-[#8B6F47]/20",
      darkBorder: "dark:border-[#A88860]/20",
      bg: "bg-[#8B6F47]/5",
      darkBg: "dark:bg-[#A88860]/10",
      label: "text-[#8B6F47]",
      darkLabel: "dark:text-[#A88860]",
      value: "text-[#8B6F47]",
      darkValue: "dark:text-[#A88860]",
    },
  };

  const style = colorStyles[color];

  const content = (
    <div className={`rounded-xl border ${style.border} ${style.darkBorder} ${style.bg} ${style.darkBg} bg-white dark:bg-[#1F1F1F] p-7 shadow-sm hover:shadow-md transition-all duration-200 hover:border-[#2D5016] dark:hover:border-[#C9A876] h-full`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase ${style.label} ${style.darkLabel} letter-spacing-wide`}>{label}</p>
          <p className={`font-[Georgia,Garamond,serif] text-4xl font-bold mt-3 ${style.value} ${style.darkValue} leading-tight`}>{value}</p>
          {description && (
            <p className="text-xs text-[#5A5A5A] dark:text-[#A8A8A8] mt-4 letter-spacing-wide">{description}</p>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
