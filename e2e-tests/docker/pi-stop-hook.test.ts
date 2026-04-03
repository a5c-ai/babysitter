import path from "path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { buildPiImage, dockerExec, startPiContainer, stopPiContainer } from "./helpers-pi";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildPiImage(ROOT);
  startPiContainer();
}, 300_000);

afterAll(() => {
  stopPiContainer();
});

describe("Pi stop-hook absence tests", () => {
  test("pi adapter reports no supported hook lifecycle", () => {
    const output = dockerExec(
      "node -e \"const {createPiAdapter}=require('/app/packages/sdk/dist/harness/pi.js'); const a=createPiAdapter(); console.log(JSON.stringify({stop:a.supportsHookType('stop'), sessionStart:a.supportsHookType('session-start')}));\"",
    ).trim();
    expect(JSON.parse(output)).toEqual({ stop: false, sessionStart: false });
  });

  test("noop hook handlers emit an empty JSON object", () => {
    const output = dockerExec(
      "node -e \"const {createPiAdapter}=require('/app/packages/sdk/dist/harness/pi.js'); const a=createPiAdapter(); a.handleStopHook({json:true,verbose:false}).then((code)=>console.log(JSON.stringify({code})));\"",
    ).trim();
    expect(output).toContain("{}");
    expect(output).toContain("\"code\":0");
  });
});
