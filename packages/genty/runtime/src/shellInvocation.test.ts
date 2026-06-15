import { describe, expect, it } from "vitest";
import { buildShellInvocation } from "./shellInvocation";

describe("buildShellInvocation", () => {
  it("builds the Windows command shell argv contract", () => {
    expect(buildShellInvocation("echo \"hello world\"", "win32")).toEqual({
      command: "cmd.exe",
      args: ["/c", "echo \"hello world\""],
    });
  });

  it("builds the POSIX bash argv contract", () => {
    expect(buildShellInvocation("printf '%s' \"$HOME\"", "linux")).toEqual({
      command: "/bin/bash",
      args: ["-c", "printf '%s' \"$HOME\""],
    });
  });
});
