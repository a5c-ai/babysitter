import type { AppNotification } from "@/hooks/use-notifications";
interface NotificationPanelProps {
    open: boolean;
    notifications: AppNotification[];
    onDismiss: (id: string) => void;
    onClose: () => void;
}
export declare function NotificationPanel({ open, notifications, onDismiss, onClose }: NotificationPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
