import { type WatchSource } from "./config-loader";
export interface DiscoveredRun {
    runDir: string;
    source: WatchSource;
    projectName: string;
    projectPath: string;
}
export declare function invalidateDiscoveryCache(): void;
export declare function discoverAllRunDirs(): Promise<DiscoveredRun[]>;
export declare function discoverAllRunsParentDirs(): Promise<string[]>;
