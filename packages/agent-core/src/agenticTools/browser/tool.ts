import { Type } from "@sinclair/typebox";
import type { CustomToolDefinition } from "../types";
import { errorResult, jsonResult, ok } from "../shared/results";

interface PuppeteerPage {
  goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
  title(): Promise<string>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  evaluate(script: string): Promise<unknown>;
  screenshot(options?: Record<string, unknown>): Promise<unknown>;
}

interface PuppeteerBrowser {
  pages(): Promise<PuppeteerPage[]>;
  newPage(): Promise<PuppeteerPage>;
  close(): Promise<void>;
}

let browserInstance: PuppeteerBrowser | null = null;

export function createBrowserTool(): CustomToolDefinition {
  return {
    name: "browser",
    label: "Headless Browser",
    description:
      "Interact with a headless browser. Actions: navigate, click, type, evaluate, screenshot, close.",
    parameters: Type.Object({
      action: Type.String({
        description: "Action: navigate | click | type | evaluate | screenshot | close",
      }),
      url: Type.Optional(Type.String({ description: "URL to navigate to" })),
      selector: Type.Optional(Type.String({ description: "CSS selector for click/type" })),
      text: Type.Optional(Type.String({ description: "Text to type" })),
      script: Type.Optional(Type.String({ description: "JavaScript to evaluate in page" })),
      options: Type.Optional(Type.Object({}, { additionalProperties: true })),
    }),
    execute: async (_toolCallId, params) => {
      let puppeteer: {
        launch: (options?: Record<string, unknown>) => Promise<PuppeteerBrowser>;
      };
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-assignment
        puppeteer = await (new Function("id", "return import(id)") as (
          id: string,
        ) => Promise<typeof puppeteer>)("puppeteer");
      } catch (error) {
        return errorResult(`puppeteer import failed: ${error instanceof Error ? error.message : String(error)}. Install with: npm install puppeteer`);
      }

      if (!browserInstance) {
        browserInstance = await puppeteer.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
      }
      const browser = browserInstance;
      const page = (await browser.pages())[0] ?? await browser.newPage();

      switch (String(params.action)) {
        case "navigate":
          await page.goto(String(params.url), { waitUntil: "domcontentloaded" });
          return ok(`Navigated to ${String(params.url)} — title: ${await page.title()}`);
        case "click":
          await page.click(String(params.selector));
          return ok(`Clicked ${String(params.selector)}`);
        case "type":
          await page.type(String(params.selector), String(params.text));
          return ok(`Typed into ${String(params.selector)}`);
        case "evaluate":
          return jsonResult(await page.evaluate(String(params.script)));
        case "screenshot": {
          const buffer = await page.screenshot({ encoding: "base64" }) as string;
          return ok(`Screenshot captured (${buffer.length} base64 chars).`);
        }
        case "close":
          await browser.close();
          browserInstance = null;
          return ok("Browser closed.");
        default:
          return errorResult(`Unknown browser action: ${String(params.action)}`);
      }
    },
  };
}
