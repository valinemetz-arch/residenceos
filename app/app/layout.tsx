import { Navigation } from "@/components/Navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navigation />
      <main className="max-w-7xl mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  );
}