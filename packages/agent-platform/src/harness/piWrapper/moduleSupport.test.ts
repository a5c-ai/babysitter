import { afterEach, describe, expect, it } from "vitest";
import {
  configureAzureOpenAiEnvDefaults,
  resolvePiModel,
  type PiCodingAgentModule,
} from "./moduleSupport";

const AZURE_ENV_KEYS = [
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_RESOURCE_NAME",
  "AZURE_OPENAI_PROJECT_NAME",
  "AZURE_OPENAI_BASE_URL",
  "AZURE_OPENAI_DEPLOYMENT",
  "AZURE_OPENAI_DEPLOYMENT_NAME_MAP",
] as const;

describe("piWrapper module support", () => {
  const originalEnv = new Map<string, string | undefined>();

  afterEach(() => {
    for (const key of AZURE_ENV_KEYS) {
      const value = originalEnv.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    originalEnv.clear();
  });

  function setAzureEnv(values: Partial<Record<(typeof AZURE_ENV_KEYS)[number], string>>): void {
    for (const key of AZURE_ENV_KEYS) {
      originalEnv.set(key, process.env[key]);
      delete process.env[key];
    }
    for (const [key, value] of Object.entries(values)) {
      process.env[key] = value;
    }
  }

  it("computes Azure OpenAI defaults without mutating process.env", () => {
    setAzureEnv({
      AZURE_OPENAI_PROJECT_NAME: "project-one",
      AZURE_OPENAI_BASE_URL: "https://project-one.openai.azure.com/openai/",
      AZURE_OPENAI_DEPLOYMENT: "deployment-one",
    });

    const defaults = configureAzureOpenAiEnvDefaults("gpt-test");

    expect(defaults).toEqual({
      AZURE_OPENAI_RESOURCE_NAME: "project-one",
      AZURE_OPENAI_BASE_URL: "https://project-one.openai.azure.com/openai/v1",
      AZURE_OPENAI_DEPLOYMENT_NAME_MAP: "gpt-test=deployment-one",
    });
    expect(process.env.AZURE_OPENAI_RESOURCE_NAME).toBeUndefined();
    expect(process.env.AZURE_OPENAI_BASE_URL).toBe("https://project-one.openai.azure.com/openai/");
    expect(process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP).toBeUndefined();
  });

  it("uses computed Azure defaults when synthesizing a Pi model entry", async () => {
    setAzureEnv({
      AZURE_OPENAI_API_KEY: "sk-test",
      AZURE_OPENAI_PROJECT_NAME: "project-two",
    });
    const defaults = configureAzureOpenAiEnvDefaults("gpt-test");
    const mod = {
      AuthStorage: { create: () => ({}) },
      ModelRegistry: class {
        find(): undefined {
          return undefined;
        }

        getAll(): [] {
          return [];
        }
      },
    } as unknown as PiCodingAgentModule;

    const model = await resolvePiModel(mod, "gpt-test", defaults);

    expect(model).toMatchObject({
      id: "gpt-test",
      provider: "azure-openai-responses",
      api: "openai-responses",
      baseUrl: "https://project-two.openai.azure.com/openai/v1",
    });
    expect(process.env.AZURE_OPENAI_RESOURCE_NAME).toBeUndefined();
    expect(process.env.AZURE_OPENAI_BASE_URL).toBeUndefined();
  });
});
