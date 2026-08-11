import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-[#2D2D2D] transition-colors">
      <Navigation />
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto py-10 px-6 sm:px-8 lg:px-12">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}