import { createPluginBundlerPresets } from "@paperclipai/plugin-sdk/bundlers";

const presets = createPluginBundlerPresets({ uiEntry: "src/ui/index.tsx" });

// Worker bundle
await presets.esbuild.worker();

// Manifest bundle
await presets.esbuild.manifest();

// UI bundle
await presets.esbuild.ui();
