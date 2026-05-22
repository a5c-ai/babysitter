export async function requestDesktopNotificationPermission(): Promise<void> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') {
    return;
  }
  await Notification.requestPermission();
}

export function showDesktopHookNotification(input: { title: string; body: string; onClick(): void }): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  const notification = new Notification(input.title, { body: input.body });
  notification.onclick = () => {
    window.focus();
    input.onClick();
    notification.close();
  };
}
