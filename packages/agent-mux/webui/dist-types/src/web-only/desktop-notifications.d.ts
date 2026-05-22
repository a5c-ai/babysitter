export declare function requestDesktopNotificationPermission(): Promise<void>;
export declare function showDesktopHookNotification(input: {
    title: string;
    body: string;
    onClick(): void;
}): void;
