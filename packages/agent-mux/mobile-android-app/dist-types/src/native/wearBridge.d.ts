export declare function subscribeToWearMessages(handler: (payload: string) => void): () => void;
export declare function sendToWear(path: string, payload: string): Promise<void>;
export declare function updateWearState(payload: string): Promise<void>;
//# sourceMappingURL=wearBridge.d.ts.map