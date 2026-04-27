import type { AppNotification } from "@/hooks/use-notifications";
interface ToastStackProps {
    notifications: AppNotification[];
    onDismiss: (id: string) => void;
}
export declare function ToastStack({ notifications, onDismiss }: ToastStackProps): import("react/jsx-runtime").JSX.Element;
export {};
