import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import {
  ProcessDiscoveryResult,
  ProcessMarker,
  ProcessMarkersResult,
} from './types';
import { resolveStaticProcessRoot } from './discoveryLocal';

export type {
  ProcessDiscoveryResult,
  ProcessMarker,
  ProcessMarkersResult,
} from './types';

export function parseProcessFileMarkers(filePath: string): ProcessMarkersResult {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return { skills: [], agents: [], hasMarkers: false };
  }

  const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (!jsdocMatch) {
    return { skills: [], agents: [], hasMarkers: false };
  }

  const jsdocBody = jsdocMatch[1];
  const markerRegex = /^\s*\*\s*@(skill|agent)\s+(\S+)(?:[ \t]+(\S+))?/gm;

  const skills: ProcessMarker[] = [];
  const agents: ProcessMarker[] = [];
  const seenSkills = new Set<string>();
  const seenAgents = new Set<string>();

  let match;
  while ((match = markerRegex.exec(jsdocBody)) !== null) {
    const type = match[1] as 'skill' | 'agent';
    const name = match[2];
    const relativePath = match[3] || undefined;

    if (type === 'skill') {
      if (!seenSkills.has(name)) {
        seenSkills.add(name);
        skills.push({ type, name, relativePath });
      }
    } else if (!seenAgents.has(name)) {
      seenAgents.add(name);
      agents.push({ type, name, relativePath });
    }
  }

  return {
    skills,
    agents,
    hasMarkers: skills.length > 0 || agents.length > 0,
  };
}

function resolveMarkersToMetadata(
  markers: ProcessMarkersResult,
  options: {
    pluginRoot?: string;
    processRoot?: string;
  },
): ProcessDiscoveryResult {
  const processRoot = resolveStaticProcessRoot(options);

  const resolveMarker = (marker: ProcessMarker): { name: string; file?: string } => {
    if (!marker.relativePath) {
      return { name: marker.name };
    }
    const resolved = path.resolve(processRoot, marker.relativePath);
    return { name: marker.name, file: resolved };
  };

  return {
    skills: markers.skills.map(resolveMarker),
    agents: markers.agents.map(resolveMarker),
  };
}

export function discoverFromProcessFile(options: {
  processFilePath: string;
  pluginRoot?: string;
  processRoot?: string;
}): ProcessDiscoveryResult | null {
  const markers = parseProcessFileMarkers(options.processFilePath);
  if (!markers.hasMarkers) {
    return null;
  }
  return resolveMarkersToMetadata(markers, {
    pluginRoot: options.pluginRoot,
    processRoot: options.processRoot,
  });
}
