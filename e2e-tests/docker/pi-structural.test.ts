import path from "path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildPiImage,
  dockerExec,
  PI_PACKAGE_ROOT,
  PI_SKILL_DIR,
  startPiContainer,
  stopPiContainer,
} from "./helpers-pi";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildPiImage(ROOT);
  startPiContainer();
}, 300_000);

afterAll(() => {
  stopPiContainer();
});

describe("Pi Docker structural tests", () => {
  test("babysitter CLI is available", () => {
    const version = dockerExec("babysitter --version").trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("pi CLI is available", () => {
    expect(dockerExec("pi --version 2>&1").trim()).toBeTruthy();
  });

  test("Node.js v20+ and jq are installed", () => {
    const nodeMajor = Number(dockerExec("node -p \"process.versions.node.split('.')[0]\"").trim());
    expect(nodeMajor).toBeGreaterThanOrEqual(20);
    expect(dockerExec("jq --version").trim()).toMatch(/^jq-/);
  });

  test("runs as the pi user with the expected home", () => {
    expect(dockerExec("whoami").trim()).toBe("pi");
    expect(dockerExec("echo $HOME").trim()).toBe("/home/pi");
  });

  test("ships the thin pi package assets", () => {
    dockerExec(`test -f ${PI_PACKAGE_ROOT}/package.json`);
    dockerExec(`test -f ${PI_SKILL_DIR}/SKILL.md`);
    const manifest = dockerExec(`node -e "const pkg=require('${PI_PACKAGE_ROOT}/package.json'); console.log(JSON.stringify(pkg.pi))"`).trim();
    expect(JSON.parse(manifest)).toEqual({
      extensions: ["./extensions"],
      skills: ["./skills"],
    });
    const skillText = dockerExec(`cat ${PI_SKILL_DIR}/SKILL.md`);
    expect(skillText).toContain("instructions:babysit-skill");
    const extensionText = dockerExec(`cat ${PI_PACKAGE_ROOT}/extensions/index.ts`);
    expect(extensionText).toContain("/skill:");
  });

  test("does not ship the removed overengineered runtime", () => {
    expect(dockerExec(`test ! -d ${PI_PACKAGE_ROOT}/extensions/babysitter && echo ok`).trim()).toBe("ok");
    expect(dockerExec(`test ! -e ${PI_PACKAGE_ROOT}/hooks.json && echo ok`).trim()).toBe("ok");
    expect(dockerExec(`test ! -d ${PI_PACKAGE_ROOT}/hooks && echo ok`).trim()).toBe("ok");
  });
});
