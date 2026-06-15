import { NativeEventEmitter, NativeModules } from 'react-native';

type WearBridgeModule = {
  sendMessage(path: string, payload: string): Promise<void>;
  updateState(payload: string): Promise<void>;
};

const bridge = NativeModules.WearableDataLayerBridge as WearBridgeModule | undefined;
const emitter = bridge ? new NativeEventEmitter(NativeModules.WearableDataLayerBridge) : null;

export function subscribeToWearMessages(handler: (payload: string) => void): () => void {
  if (!emitter) {
    return () => undefined;
  }
  const subscription = emitter.addListener('wearMessage', (event: { payload?: string }) => {
    if (typeof event.payload === 'string') {
      handler(event.payload);
    }
  });
  return () => subscription.remove();
}

export async function sendToWear(path: string, payload: string): Promise<void> {
  if (!bridge) {
    return;
  }
  await bridge.sendMessage(path, payload);
}

export async function updateWearState(payload: string): Promise<void> {
  if (!bridge) {
    return;
  }
  await bridge.updateState(payload);
}
