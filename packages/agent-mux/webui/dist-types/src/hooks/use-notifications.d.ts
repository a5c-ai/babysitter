export interface AppNotification {
    id: string;
    title: string;
    body: string;
    type: "success" | "error" | "warning" | "info";
    timestamp: number;
    href?: string;
    /** When true the notification will not auto-dismiss and must be closed manually or resolved externally. */
    persistent?: boolean;
}
export declare function useNotifications(): {
    notifications: AppNotification[];
    notify: (title: string, body: string, type?: AppNotification["type"], options?: {
        href?: string;
        persistent?: boolean;
    }) => void;
    dismiss: (id: string) => void;
    requestPermission: () => Promise<void>;
    permission: NotificationPermission;
};
