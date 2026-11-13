import { afterEach, describe, expect, test } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { findProtectedBreakpointInSource } from "../breakpointPreflight";

const files: string[] = [];

afterEach(async () => {
  await Promise.all(files.splice(0).map((file) => fs.rm(file, { force: true })));
});

async function inspect(source: string): Promise<string | undefined> {
  const file = path.join(os.tmpdir(), `breakpoint-preflight-${crypto.randomUUID()}.mjs`);
  files.push(file);
  await fs.writeFile(file, source);
  return findProtectedBreakpointInSource(file);
}

describe("breakpoint source preflight", () => {
  test("recognizes a static template literal method", async () => {
    expect(await inspect('export function process(_, ctx) { ctx[`breakpoint`]({}, { expert: "owner" }); }'))
      .toBe("protected breakpoint");
  });

  test("does not mistake a computed identifier for the breakpoint method", async () => {
    expect(await inspect('export function process(_, ctx) { const breakpoint = "other"; ctx[breakpoint]({}, { expert: "owner" }); }'))
      .toBeUndefined();
  });

  test("respects context parameter and block shadowing", async () => {
    expect(await inspect(`export function process(_, ctx) {
      function helper(ctx) { ctx.breakpoint({}, { expert: "owner" }); }
      { const ctx = { breakpoint() {} }; ctx.breakpoint({}, { expert: "owner" }); }
      ctx.breakpoint({}, { tags: ["review"] });
    }`)).toBeUndefined();
  });

  test("follows a context alias through a nested scope", async () => {
    expect(await inspect(`export function process(_, ctx) {
      { const alias = ctx; alias.breakpoint({}, { expert: "owner" }); }
    }`)).toBe("protected breakpoint");
  });

  test("does not confuse a shadowed alias with the context", async () => {
    expect(await inspect(`export function process(_, ctx) {
      const alias = ctx;
      { const alias = { breakpoint() {} }; alias.breakpoint({}, { expert: "owner" }); }
    }`)).toBeUndefined();
  });

  test("does not confuse a catch binding with the context", async () => {
    expect(await inspect(`export function process(_, ctx) {
      try {} catch (ctx) { ctx.breakpoint({}, { expert: "owner" }); }
    }`)).toBeUndefined();
  });

  test("resolves destructured catch bindings and restores context afterward", async () => {
    expect(await inspect(`export function process(_, ctx) {
      try {} catch ({ ctx }) { ctx.breakpoint({}, { expert: "owner" }); }
      ctx.breakpoint({}, { expert: "owner" });
    }`)).toBe("protected breakpoint");
    expect(await inspect(`export function process(_, ctx) {
      try {} catch ({ error: ctx }) { ctx.breakpoint({}, { expert: "owner" }); }
    }`)).toBeUndefined();
  });

  test("allows an empty expert as runtime policy does", async () => {
    expect(await inspect('export function process(_, ctx) { ctx.breakpoint({}, { expert: "  ", tags: ["review"] }); }'))
      .toBeUndefined();
    expect(await inspect('export function process(_, ctx) { ctx.breakpoint({}, { expert: [] }); }'))
      .toBeUndefined();
  });

  test("finds the process in a multi declarator export", async () => {
    expect(await inspect('export const other = 1, process = (_, ctx) => ctx.breakpoint({}, { expert: "owner" });'))
      .toBe("protected breakpoint");
  });
});
