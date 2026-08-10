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
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 dark:border-slate-700 dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-900">
        <h1 className="text-4xl font-bold dark:text-white">Welcome to ResidenceOS</h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
          Your complete home management workspace — from construction to warranty tracking.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spaces"
          value={stats.spaces}
          icon="🏠"
          href="/app/spaces"
          description="Rooms & areas"
        />
        <StatCard
          label="Assets"
          value={stats.assets}
          icon="🔧"
          href="/app/assets"
          description="Installed products"
        />
        <StatCard
          label="Tasks"
          value={stats.tasks}
          icon="✓"
          href="/app/tasks"
          description="Work items"
        />
        <StatCard
          label="Systems"
          value={stats.systems}
          icon="⚙️"
          href="/app/systems"
          description="Building systems"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Budget Items"
          value={stats.budgetItems}
          icon="💰"
          href="/app/budget"
          description="Cost tracking"
        />
        <StatCard
          label="Warranties"
          value={stats.warranties}
          icon="🛡️"
          href="/app/warranties"
          description="Coverage & protection"
        />
        <StatCard
          label="Users"
          value={stats.users}
          icon="👥"
          description="Team members"
        />
      </div>

      {/* Quick Start Guide */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-semibold dark:text-white mb-4">Quick Start</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex gap-3">
            <span className="text-2xl">1️⃣</span>
            <div>
              <p className="font-medium dark:text-white">Create Spaces</p>
              <p className="text-gray-600 dark:text-gray-400">Define your rooms & areas</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">2️⃣</span>
            <div>
              <p className="font-medium dark:text-white">Add Assets</p>
              <p className="text-gray-600 dark:text-gray-400">Track your products & equipment</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">3️⃣</span>
            <div>
              <p className="font-medium dark:text-white">Manage Warranties</p>
              <p className="text-gray-600 dark:text-gray-400">Never miss coverage again</p>
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
  description
}: {
  label: string;
  value: number;
  icon: string;
  href?: string;
  description?: string;
}) {
  const content = (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:border-slate-700 dark:bg-slate-900 h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold mt-1 dark:text-white">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{description}</p>
          )}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        {content}
      </Link>
    );
  }

  return content;
}
