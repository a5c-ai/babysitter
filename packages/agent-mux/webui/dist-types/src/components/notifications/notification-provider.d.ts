import { type ReactNode } from "react";
import { type AppNotification } from "@/hooks/use-notifications";
interface NotificationContextValue {
    notify: (title: string, body: string, type?: AppNotification["type"], options?: {
        href?: string;
        persistent?: boolean;
    }) => void;
    requestPermission: () => void;
    permission: NotificationPermission;
    notifications: AppNotification[];
    dismiss: (id: string) => void;
}
export declare const useNotificationContext: () => NotificationContextValue;
/** Duration after mount during which watermarks are seeded silently (no notifications). */
export declare const STABILIZATION_WINDOW_MS = 10000;
export declare function NotificationProvider({ children }: {
    children: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export {};
