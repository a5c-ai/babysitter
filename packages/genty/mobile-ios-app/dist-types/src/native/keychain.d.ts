import type { StoredGatewayAuth } from '../types.js';
export declare function readGatewayAuth(host: string): Promise<StoredGatewayAuth | null>;
export declare function writeGatewayAuth(auth: StoredGatewayAuth): Promise<void>;
export declare function clearGatewayAuth(host: string): Promise<void>;
//# sourceMappingURL=keychain.d.ts.map