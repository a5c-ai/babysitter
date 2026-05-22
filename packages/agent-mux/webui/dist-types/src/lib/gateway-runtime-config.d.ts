export declare const DEFAULT_LOCAL_GATEWAY_URL = "http://127.0.0.1:7878";
export declare const DEFAULT_BOOTSTRAP_LOGIN_PATH = "/api/v1/bootstrap/login";
export type GatewayAuthMode = "manual" | "bootstrap-admin";
export interface GatewayRuntimeConfig {
    defaultGatewayUrl: string | null;
    proxyGatewayUrl: string;
    authMode: GatewayAuthMode;
    bootstrapAdminUsername: string | null;
    bootstrapLoginPath: string;
}
export interface PublicGatewayRuntimeConfig {
    defaultGatewayUrl: string | null;
    authMode: GatewayAuthMode;
    bootstrapAdminUsername: string | null;
    bootstrapLoginPath: string;
}
export declare function sanitizeGatewayUrl(url: string): string;
export declare function normalizeGatewayUrl(url: string | null | undefined): string | null;
export declare function resolveGatewayAuthMode(value: string | null | undefined): GatewayAuthMode;
export declare function resolveGatewayRuntimeConfig(env?: NodeJS.ProcessEnv): GatewayRuntimeConfig;
export declare function toPublicGatewayRuntimeConfig(config: GatewayRuntimeConfig): PublicGatewayRuntimeConfig;
export declare function buildGatewayTargetUrl(baseUrl: string, pathname: string, search?: string): string;
export declare function gatewayProxyPath(pathname: string): string;
export declare function extractBootstrapToken(payload: unknown): string | null;
