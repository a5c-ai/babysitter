/**
 * plugin:* commands — Manage plugins and marketplaces.
 */

export type { PluginCommandArgs } from './plugin/shared';
export { validateScope, requireArg } from './plugin/shared';
export {
  handlePluginAddMarketplace,
  handlePluginUpdateMarketplace,
  handlePluginListPlugins,
} from './plugin/marketplaceCommands';
export {
  handlePluginInstall,
  handlePluginUninstall,
  handlePluginUpdate,
  handlePluginConfigure,
} from './plugin/packageCommands';
export {
  handlePluginListInstalled,
  handlePluginUpdateRegistry,
  handlePluginRemoveFromRegistry,
} from './plugin/registryCommands';
