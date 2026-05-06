import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

export const metadata: Metadata = {
  title: "Atlas Graph Explorer",
  description: "Browse the Atlas catalog graph: NodeKinds, EdgeKinds, records, and associations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="cpd-dark h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ background: 'var(--bg)', color: 'var(--fg)' }}
      >
        <Header />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main
            className="flex-1 min-w-0 overflow-y-auto p-6"
            style={{ background: 'var(--bg)' }}
          >
            {children}
          </main>
        </div>
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
