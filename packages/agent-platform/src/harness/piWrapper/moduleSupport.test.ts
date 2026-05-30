import { describe, expect, it } from "vitest";
import { configureAzureOpenAiEnvDefaults } from "./moduleSupport";

describe("configureAzureOpenAiEnvDefaults", () => {
  it("returns a Pi-compatible Azure overlay without mutating the input env", () => {
    const env = {
      AZURE_OPENAI_API_KEY: "azure-key",
      AZURE_OPENAI_PROJECT_NAME: "my-resource",
      AZURE_OPENAI_DEPLOYMENT: "deployment-1",
    };

    const overlay = configureAzureOpenAiEnvDefaults("gpt-4.1", env);

    expect(env).not.toHaveProperty("AZURE_OPENAI_RESOURCE_NAME");
    expect(env).not.toHaveProperty("AZURE_OPENAI_BASE_URL");
    expect(env).not.toHaveProperty("AZURE_OPENAI_DEPLOYMENT_NAME_MAP");
    expect(overlay).toEqual({
      AZURE_OPENAI_RESOURCE_NAME: "my-resource",
      AZURE_OPENAI_BASE_URL: "https://my-resource.openai.azure.com/openai/v1",
      AZURE_OPENAI_DEPLOYMENT_NAME_MAP: "gpt-4.1=deployment-1",
    });
  });

  it("normalizes an explicit Azure base URL in the overlay only", () => {
    const env = {
      AZURE_OPENAI_BASE_URL: "https://my-resource.openai.azure.com/",
    };

    expect(configureAzureOpenAiEnvDefaults(undefined, env)).toEqual({
      AZURE_OPENAI_BASE_URL: "https://my-resource.openai.azure.com/openai/v1",
    });
    expect(env.AZURE_OPENAI_BASE_URL).toBe("https://my-resource.openai.azure.com/");
  });
});
