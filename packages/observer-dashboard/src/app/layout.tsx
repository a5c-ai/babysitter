import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export const metadata: Metadata = {
  title: "Babysitter Observer | a5c.ai",
  description: "Real-time observability for babysitter orchestration runs",
  icons: {
    icon: "/icon.svg",
  },
};

// Inline script to set theme before first paint (avoids flash)
const themeScript = `(function(){try{var t=localStorage.getItem("observer-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);document.documentElement.className=t}else{document.documentElement.setAttribute("data-theme","dark");document.documentElement.className="dark"}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0b" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="relative flex min-h-screen flex-col">
          <ErrorBoundary>
            <Providers>
              {children}
            </Providers>
          </ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
