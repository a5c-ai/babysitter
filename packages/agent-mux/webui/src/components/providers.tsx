"use client";
import { ToastProvider } from "@a5c-ai/compendium";
import { GatewayProvider } from "@/components/agent-mux/gateway-provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { EventStreamProvider } from "@/components/providers/event-stream-provider";
import { ShortcutsHelp } from "@/components/shared/shortcuts-help";
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/shared/app-footer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <GatewayProvider>
          <NotificationProvider>
            <EventStreamProvider>
              <div className="flex flex-col min-h-screen">
                <AppHeader />
                <main id="main-content" className="flex-1 flex flex-col">{children}</main>
                <AppFooter />
              </div>
              <ShortcutsHelp />
            </EventStreamProvider>
          </NotificationProvider>
        </GatewayProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
