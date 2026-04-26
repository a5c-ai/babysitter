import React from 'react';
type SavedGatewayAuth = {
    gatewayUrl: string;
    token: string;
};
type GatewayAuthContextValue = {
    auth: SavedGatewayAuth | null;
    isAuthenticated: boolean;
    login(input: SavedGatewayAuth): Promise<void>;
    logout(): void;
};
export declare function GatewayProvider(props: {
    children: React.ReactNode;
}): JSX.Element;
export declare function useGatewayAuth(): GatewayAuthContextValue;
export declare function useGatewayFetch(): (pathname: string, init?: RequestInit) => Promise<Response>;
export {};
//# sourceMappingURL=GatewayProvider.d.ts.map