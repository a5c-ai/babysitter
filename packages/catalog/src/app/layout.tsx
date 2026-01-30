import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond, Cinzel_Decorative } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-header",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-victorian",
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Process Library Catalog",
  description:
    "Browse and explore process definitions, agents, and skills for the babysitter framework",
  keywords: [
    "process",
    "catalog",
    "agents",
    "skills",
    "babysitter",
    "automation",
  ],
  authors: [{ name: "A5C AI" }],
  openGraph: {
    title: "Process Library Catalog",
    description:
      "Browse and explore process definitions, agents, and skills for the babysitter framework",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${garamond.variable} ${cinzelDecorative.variable} min-h-screen antialiased`}>
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
