/**
 * @process specializations/desktop-development/linux-packaging
 * @description Linux Distribution Packaging - Create distribution packages for Linux including .deb (Debian/Ubuntu),
 * .rpm (Fedora/RHEL), AppImage, Flatpak, and Snap; configure repositories and package metadata.
 * @inputs { projectName: string, framework: string, packageFormats: array, distributions: array, outputDir?: string }
 * @outputs { success: boolean, packages: array, repositories?: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/linux-packaging', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   packageFormats: ['deb', 'rpm', 'appimage', 'flatpak', 'snap'],
 *   distributions: ['ubuntu', 'debian', 'fedora']
 * });
 *
 * @references
 * - electron-builder Linux targets: https://www.electron.build/configuration/linux
 * - Flatpak documentation: https://docs.flatpak.org/
 * - Snapcraft: https://snapcraft.io/docs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    packageFormats = ['deb', 'rpm', 'appimage'],
    distributions = ['ubuntu', 'debian', 'fedora'],
    outputDir = 'linux-packaging'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Linux Distribution Packaging: ${projectName}`);

  const requirements = await ctx.task(linuxPackagingRequirementsTask, { projectName, framework, packageFormats, distributions, outputDir });
  artifacts.push(...requirements.artifacts);

  const packages = [];

  // DEB package
  if (packageFormats.includes('deb')) {
    const deb = await ctx.task(createDebPackageTask, { projectName, framework, distributions, outputDir });
    artifacts.push(...deb.artifacts);
    packages.push({ format: 'deb', ...deb });
  }

  // RPM package
  if (packageFormats.includes('rpm')) {
    const rpm = await ctx.task(createRpmPackageTask, { projectName, framework, distributions, outputDir });
    artifacts.push(...rpm.artifacts);
    packages.push({ format: 'rpm', ...rpm });
  }

  // AppImage
  if (packageFormats.includes('appimage')) {
    const appimage = await ctx.task(createAppImageTask, { projectName, framework, outputDir });
    artifacts.push(...appimage.artifacts);
    packages.push({ format: 'appimage', ...appimage });
  }

  // Flatpak
  if (packageFormats.includes('flatpak')) {
    const flatpak = await ctx.task(createFlatpakTask, { projectName, framework, outputDir });
    artifacts.push(...flatpak.artifacts);
    packages.push({ format: 'flatpak', ...flatpak });
  }

  // Snap
  if (packageFormats.includes('snap')) {
    const snap = await ctx.task(createSnapTask, { projectName, framework, outputDir });
    artifacts.push(...snap.artifacts);
    packages.push({ format: 'snap', ...snap });
  }

  await ctx.breakpoint({
    question: `Linux packages created: ${packages.map(p => p.format).join(', ')}. Total: ${packages.length} packages. Review?`,
    title: 'Linux Packaging Review',
    context: { runId: ctx.runId, packages: packages.map(p => p.format) }
  });

  // Desktop entry and icons
  const desktopEntry = await ctx.task(createDesktopEntryTask, { projectName, framework, outputDir });
  artifacts.push(...desktopEntry.artifacts);

  // Repository setup
  let repositories = null;
  if (packageFormats.includes('deb') || packageFormats.includes('rpm')) {
    repositories = await ctx.task(setupLinuxRepositoryTask, { projectName, packageFormats, outputDir });
    artifacts.push(...repositories.artifacts);
  }

  const validation = await ctx.task(validateLinuxPackagesTask, { projectName, framework, packageFormats, packages, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    packages: packages.map(p => ({ format: p.format, path: p.packagePath, size: p.size })),
    desktopEntry: desktopEntry.entryPath,
    repositories: repositories ? { configured: true, types: repositories.repoTypes } : null,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/linux-packaging', timestamp: startTime }
  };
}

export const linuxPackagingRequirementsTask = defineTask('linux-packaging-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Linux Packaging Requirements - ${args.projectName}`,
  agent: {
    name: 'linux-packaging-expert',
    prompt: { role: 'Linux Packaging Analyst', task: 'Analyze Linux packaging requirements', context: args, instructions: ['1. Analyze package format needs', '2. Document dependencies', '3. Check distribution requirements', '4. Plan package metadata', '5. Document icon requirements', '6. Plan desktop integration', '7. Assess signing needs', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'packaging']
}));

export const createDebPackageTask = defineTask('create-deb-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `DEB Package - ${args.projectName}`,
  skill: {
    name: 'deb-package-builder',
  },
  agent: {
    name: 'linux-packaging-expert',
    prompt: { role: 'DEB Package Developer', task: 'Create Debian/Ubuntu package', context: args, instructions: ['1. Create debian control file', '2. Configure dependencies', '3. Set up post-install scripts', '4. Configure package metadata', '5. Set up file locations', '6. Configure maintainer scripts', '7. Build DEB package', '8. Generate package configuration'] },
    outputSchema: { type: 'object', required: ['packagePath', 'artifacts'], properties: { packagePath: { type: 'string' }, size: { type: 'string' }, dependencies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'deb']
}));

export const createRpmPackageTask = defineTask('create-rpm-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `RPM Package - ${args.projectName}`,
  skill: {
    name: 'rpm-spec-generator',
  },
  agent: {
    name: 'linux-packaging-expert',
    prompt: { role: 'RPM Package Developer', task: 'Create Fedora/RHEL package', context: args, instructions: ['1. Create spec file', '2. Configure requires', '3. Set up scriptlets', '4. Configure package info', '5. Set up file sections', '6. Configure changelog', '7. Build RPM package', '8. Generate package configuration'] },
    outputSchema: { type: 'object', required: ['packagePath', 'artifacts'], properties: { packagePath: { type: 'string' }, size: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'rpm']
}));

export const createAppImageTask = defineTask('create-appimage', (args, taskCtx) => ({
  kind: 'agent',
  title: `AppImage - ${args.projectName}`,
  skill: {
    name: 'appimage-builder',
  },
  agent: {
    name: 'linux-packaging-expert',
    prompt: { role: 'AppImage Developer', task: 'Create AppImage package', context: args, instructions: ['1. Create AppDir structure', '2. Configure AppRun script', '3. Set up desktop file', '4. Configure icon', '5. Bundle dependencies', '6. Create AppImage', '7. Sign AppImage', '8. Generate configuration'] },
    outputSchema: { type: 'object', required: ['packagePath', 'artifacts'], properties: { packagePath: { type: 'string' }, size: { type: 'string' }, portable: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'appimage']
}));

export const createFlatpakTask = defineTask('create-flatpak', (args, taskCtx) => ({
  kind: 'agent',
  title: `Flatpak - ${args.projectName}`,
  skill: {
    name: 'flatpak-manifest-generator',
  },
  agent: {
    name: 'linux-packaging-expert',
    prompt: { role: 'Flatpak Developer', task: 'Create Flatpak package', context: args, instructions: ['1. Create manifest file', '2. Configure SDK and runtime', '3. Set up permissions', '4. Configure finish args', '5. Set up build options', '6. Configure Flathub metadata', '7. Build Flatpak', '8. Generate configuration'] },
    outputSchema: { type: 'object', required: ['packagePath', 'artifacts'], properties: { packagePath: { type: 'string' }, appId: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'flatpak']
}));

export const createSnapTask = defineTask('create-snap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Snap Package - ${args.projectName}`,
  skill: {
    name: 'snap-yaml-generator',
  },
  agent: {
    name: 'linux-packaging-expert',
    prompt: { role: 'Snap Developer', task: 'Create Snap package', context: args, instructions: ['1. Create snapcraft.yaml', '2. Configure confinement', '3. Set up plugs', '4. Configure parts', '5. Set up apps', '6. Configure grade', '7. Build Snap', '8. Generate configuration'] },
    outputSchema: { type: 'object', required: ['packagePath', 'artifacts'], properties: { packagePath: { type: 'string' }, confinement: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'snap']
}));

export const createDesktopEntryTask = defineTask('create-desktop-entry', (args, taskCtx) => ({
  kind: 'agent',
  title: `Desktop Entry - ${args.projectName}`,
  agent: {
    name: 'desktop-entry-developer',
    prompt: { role: 'Desktop Entry Developer', task: 'Create desktop entry and icons', context: args, instructions: ['1. Create .desktop file', '2. Configure categories', '3. Set up actions', '4. Configure MIME types', '5. Create icon set (16-512px)', '6. Install to correct locations', '7. Update desktop database', '8. Generate desktop entry'] },
    outputSchema: { type: 'object', required: ['entryPath', 'artifacts'], properties: { entryPath: { type: 'string' }, iconSizes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'desktop-entry']
}));

export const setupLinuxRepositoryTask = defineTask('setup-linux-repository', (args, taskCtx) => ({
  kind: 'agent',
  title: `Linux Repository - ${args.projectName}`,
  agent: {
    name: 'repo-developer',
    prompt: { role: 'Repository Developer', task: 'Set up package repository', context: args, instructions: ['1. Set up APT repository', '2. Set up YUM/DNF repository', '3. Configure GPG signing', '4. Create repository metadata', '5. Configure update mechanism', '6. Set up hosting', '7. Create installation instructions', '8. Generate repository configuration'] },
    outputSchema: { type: 'object', required: ['repoTypes', 'artifacts'], properties: { repoTypes: { type: 'array' }, gpgKeyId: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'repository']
}));

export const validateLinuxPackagesTask = defineTask('validate-linux-packages', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Linux Packages - ${args.projectName}`,
  agent: {
    name: 'linux-validator',
    prompt: { role: 'Linux Package Validator', task: 'Validate Linux packages', context: args, instructions: ['1. Validate each package format', '2. Test installation', '3. Verify desktop integration', '4. Test uninstallation', '5. Verify dependencies', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'linux', 'validation']
}));
