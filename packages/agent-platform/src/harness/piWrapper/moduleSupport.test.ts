import { describe, expect, it } from "vitest";
import { configureAzureOpenAiEnvDefaults } from "./moduleSupport";

describe("configureAzureOpenAiEnvDefaults", () => {
  it("returns Pi-compatible Azure defaults without mutating process.env", () => {
    delete process.env.AZURE_OPENAI_RESOURCE_NAME;
    delete process.env.AZURE_OPENAI_BASE_URL;
    delete process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP;

    const env: NodeJS.ProcessEnv = {
      AZURE_OPENAI_PROJECT_NAME: "project-a",
      AZURE_OPENAI_DEPLOYMENT: "deployment-a",
    };

    const defaults = configureAzureOpenAiEnvDefaults("gpt-4o", env);

    expect(defaults).toEqual({
      AZURE_OPENAI_RESOURCE_NAME: "project-a",
      AZURE_OPENAI_BASE_URL: "https://project-a.openai.azure.com/openai/v1",
      AZURE_OPENAI_DEPLOYMENT_NAME_MAP: "gpt-4o=deployment-a",
    });
    expect(process.env.AZURE_OPENAI_RESOURCE_NAME).toBeUndefined();
    expect(process.env.AZURE_OPENAI_BASE_URL).toBeUndefined();
    expect(process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP).toBeUndefined();
  });
});
