import { ReportBuilder } from "@/components/ReportBuilder";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Reports</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View your project budget, assets, and detailed schedules
        </p>
      </div>
      <ReportBuilder />
    </div>
  );
}
