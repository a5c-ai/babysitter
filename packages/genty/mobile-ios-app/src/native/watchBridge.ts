import { NativeEventEmitter, NativeModules } from 'react-native';

type WatchBridgeModule = {
  sendToWatch(payload: string): Promise<void>;
};

const bridge = NativeModules.WatchConnectivityBridge as WatchBridgeModule | undefined;
const emitter = bridge ? new NativeEventEmitter(NativeModules.WatchConnectivityBridge) : null;

export function subscribeToWatchMessages(handler: (payload: string) => void): () => void {
  if (!emitter) {
    return () => undefined;
  }
  const subscription = emitter.addListener('watchMessage', (event: { payload?: string }) => {
    if (typeof event.payload === 'string') {
      handler(event.payload);
    }
  });
  return () => subscription.remove();
}

export async function sendToWatch(payload: string): Promise<void> {
  if (!bridge) {
    return;
  }
  await bridge.sendToWatch(payload);
}
