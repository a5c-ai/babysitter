import React from 'react';
type GatewayAuthContextValue = {
    isAuthenticated: boolean;
    gatewayUrl: string | null;
};
export declare function GatewayProvider(props: {
    children: React.ReactNode;
}): JSX.Element;
export declare function useGatewayAuth(): GatewayAuthContextValue;
export {};
//# sourceMappingURL=GatewayProvider.d.ts.map