import path from "path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildOhMyPiImage,
  dockerExec,
  OH_MY_PI_PACKAGE_ROOT,
  OH_MY_PI_SKILL_DIR,
  startOhMyPiContainer,
  stopOhMyPiContainer,
} from "./helpers-oh-my-pi";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildOhMyPiImage(ROOT);
  startOhMyPiContainer();
}, 300_000);

afterAll(() => {
  stopOhMyPiContainer();
});

describe("oh-my-pi Docker structural tests", () => {
  test("babysitter CLI is available", () => {
    const version = dockerExec("babysitter --version").trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("omp CLI is available", () => {
    expect(dockerExec("omp --version 2>&1").trim()).toBeTruthy();
  });

  test("Node.js v20+ and jq are installed", () => {
    const nodeMajor = Number(dockerExec("node -p \"process.versions.node.split('.')[0]\"").trim());
    expect(nodeMajor).toBeGreaterThanOrEqual(20);
    expect(dockerExec("jq --version").trim()).toMatch(/^jq-/);
  });

  test("runs as the omp user with the expected home", () => {
    expect(dockerExec("whoami").trim()).toBe("omp");
    expect(dockerExec("echo $HOME").trim()).toBe("/home/omp");
  });

  test("ships the thin omp package assets", () => {
    dockerExec(`test -f ${OH_MY_PI_PACKAGE_ROOT}/package.json`);
    dockerExec(`test -f ${OH_MY_PI_SKILL_DIR}/SKILL.md`);
    const manifest = dockerExec(`node -e "const pkg=require('${OH_MY_PI_PACKAGE_ROOT}/package.json'); console.log(JSON.stringify(pkg.omp))"`).trim();
    expect(JSON.parse(manifest)).toEqual({
      extensions: ["./extensions"],
      skills: ["./skills"],
    });
    const skillText = dockerExec(`cat ${OH_MY_PI_SKILL_DIR}/SKILL.md`);
    expect(skillText).toContain("instructions:babysit-skill");
    const extensionText = dockerExec(`cat ${OH_MY_PI_PACKAGE_ROOT}/extensions/index.ts`);
    expect(extensionText).toContain("/skill:");
  });

  test("does not ship the removed overengineered runtime", () => {
    expect(dockerExec(`test ! -d ${OH_MY_PI_PACKAGE_ROOT}/extensions/babysitter && echo ok`).trim()).toBe("ok");
    expect(dockerExec(`test ! -e ${OH_MY_PI_PACKAGE_ROOT}/hooks.json && echo ok`).trim()).toBe("ok");
    expect(dockerExec(`test ! -d ${OH_MY_PI_PACKAGE_ROOT}/hooks && echo ok`).trim()).toBe("ok");
  });
});
