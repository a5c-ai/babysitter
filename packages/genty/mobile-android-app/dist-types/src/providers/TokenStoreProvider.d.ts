import React from 'react';
import type { StoredGatewayAuth } from '../types.js';
type TokenStoreContextValue = {
    auth: StoredGatewayAuth | null;
    hydrated: boolean;
    login(auth: StoredGatewayAuth): Promise<void>;
    logout(): Promise<void>;
};
export declare function TokenStoreProvider(props: {
    children: React.ReactNode;
}): JSX.Element;
export declare function useTokenStore(): TokenStoreContextValue;
export {};
//# sourceMappingURL=TokenStoreProvider.d.ts.map