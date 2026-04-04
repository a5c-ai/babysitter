import path from "path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { buildOhMyPiImage, dockerExec, startOhMyPiContainer, stopOhMyPiContainer } from "./helpers-oh-my-pi";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildOhMyPiImage(ROOT);
  startOhMyPiContainer();
}, 300_000);

afterAll(() => {
  stopOhMyPiContainer();
});

describe("oh-my-pi stop-hook absence tests", () => {
  test("oh-my-pi adapter reports no supported hook lifecycle", () => {
    const output = dockerExec(
      "node -e \"const {createOhMyPiAdapter}=require('/app/packages/sdk/dist/harness/ohMyPi.js'); const a=createOhMyPiAdapter(); console.log(JSON.stringify({stop:a.supportsHookType('stop'), sessionStart:a.supportsHookType('session-start')}));\"",
    ).trim();
    expect(JSON.parse(output)).toEqual({ stop: false, sessionStart: false });
  });

  test("noop hook handlers emit an empty JSON object", () => {
    const output = dockerExec(
      "node -e \"const {createOhMyPiAdapter}=require('/app/packages/sdk/dist/harness/ohMyPi.js'); const a=createOhMyPiAdapter(); a.handleStopHook({json:true,verbose:false}).then((code)=>console.log(JSON.stringify({code})));\"",
    ).trim();
    expect(output).toContain("{}");
    expect(output).toContain("\"code\":0");
  });
});
