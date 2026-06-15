import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";

export const metadata: Metadata = {
  title: "Agentic AI Atlas",
  description: "Agentic AI Atlas by a5c.ai. Browse records, graph links, and linked documentation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="vellum" className="h-full antialiased" suppressHydrationWarning>
      <body className="atlas-body">
        <Script id="atlas-theme-init" strategy="beforeInteractive">{`
          try {
            var theme = window.localStorage.getItem("atlas-theme") || "vellum";
            document.documentElement.dataset.theme = theme;
          } catch {}
        `}</Script>
        <div className="atlas-app-shell">
          <Header />
          <main className="atlas-main-content">{children}</main>
        </div>
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
