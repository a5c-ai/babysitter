import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import type { McpServerConfig } from "@a5c-ai/agent-mux-core";

export interface StoredAgentConfiguration {
  model?: string;
  provider?: string;
  approvalMode?: "yolo" | "prompt" | "deny";
  maxTokens?: number;
}

export interface SettingsSectionStorage {
  agentConfiguration: Record<string, StoredAgentConfiguration>;
  mcpServers: Record<string, McpServerConfig[]>;
}

const DEFAULT_STORAGE_PATH = path.join(os.homedir(), ".a5c", "kanban-settings-sections.json");

function getStoragePath(): string {
  return process.env.KANBAN_SETTINGS_SECTION_STORE || DEFAULT_STORAGE_PATH;
}

async function readStorageFile(): Promise<SettingsSectionStorage | null> {
  try {
    const content = await fs.readFile(getStoragePath(), "utf8");
    const parsed = JSON.parse(content) as Partial<SettingsSectionStorage>;
    return {
      agentConfiguration:
        parsed.agentConfiguration && typeof parsed.agentConfiguration === "object"
          ? parsed.agentConfiguration
          : {},
      mcpServers:
        parsed.mcpServers && typeof parsed.mcpServers === "object" ? parsed.mcpServers : {},
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return null;
    }
    throw error;
  }
}

export async function loadSettingsSectionStorage(): Promise<SettingsSectionStorage> {
  return (
    (await readStorageFile()) ?? {
      agentConfiguration: {},
      mcpServers: {},
    }
  );
}

export async function writeSettingsSectionStorage(
  data: SettingsSectionStorage,
): Promise<void> {
  const filePath = getStoragePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}
