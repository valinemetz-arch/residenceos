import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResidenceOS",
  description: "Digital twin and project management for Nemetz Residence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-50 transition-colors">
        {children}
      </body>
    </html>
  );
}