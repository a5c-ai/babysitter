import { describe, it, expect } from "vitest";
import { AppError, normalizeError } from "../error-handler";

describe("AppError", () => {
  it("extends Error with code and status fields", () => {
    const err = new AppError("Not found", "NOT_FOUND", 404);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe("Not found");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.status).toBe(404);
    expect(err.name).toBe("AppError");
  });

  it("has a proper stack trace", () => {
    const err = new AppError("test", "TEST", 500);
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain("AppError");
  });

  it("supports instanceof checks", () => {
    const err = new AppError("msg", "CODE", 400);
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe("normalizeError", () => {
  it("preserves AppError code and status", () => {
    const err = new AppError("Bad request", "BAD_REQUEST", 400);
    const result = normalizeError(err);
    expect(result).toEqual({
      message: "Bad request",
      code: "BAD_REQUEST",
      status: 400,
    });
  });

  it("maps ENOENT to 404 NOT_FOUND", () => {
    const err = Object.assign(new Error("no such file"), { code: "ENOENT" });
    const result = normalizeError(err);
    expect(result.status).toBe(404);
    expect(result.code).toBe("NOT_FOUND");
    expect(result.message).toBe("Resource not found");
  });

  it("maps EACCES to 403 PERMISSION_DENIED", () => {
    const err = Object.assign(new Error("permission denied"), { code: "EACCES" });
    const result = normalizeError(err);
    expect(result.status).toBe(403);
    expect(result.code).toBe("PERMISSION_DENIED");
  });

  it("maps EPERM to 403 PERMISSION_DENIED", () => {
    const err = Object.assign(new Error("operation not permitted"), { code: "EPERM" });
    const result = normalizeError(err);
    expect(result.status).toBe(403);
    expect(result.code).toBe("PERMISSION_DENIED");
  });

  it("maps ENOTDIR to 400 INVALID_PATH", () => {
    const err = Object.assign(new Error("not a directory"), { code: "ENOTDIR" });
    const result = normalizeError(err);
    expect(result.status).toBe(400);
    expect(result.code).toBe("INVALID_PATH");
  });

  it("maps EISDIR to 400 INVALID_PATH", () => {
    const err = Object.assign(new Error("is a directory"), { code: "EISDIR" });
    const result = normalizeError(err);
    expect(result.status).toBe(400);
    expect(result.code).toBe("INVALID_PATH");
  });

  it("maps SyntaxError to 400 PARSE_ERROR", () => {
    let parseErr: Error;
    try {
      JSON.parse("{invalid json}");
      parseErr = new Error("should not reach");
    } catch (e) {
      parseErr = e as Error;
    }
    const result = normalizeError(parseErr);
    expect(result.status).toBe(400);
    expect(result.code).toBe("PARSE_ERROR");
    expect(result.message).toBe("Failed to parse data");
  });

  it("converts generic Error to 500 INTERNAL_ERROR", () => {
    const result = normalizeError(new Error("something broke"));
    expect(result).toEqual({
      message: "something broke",
      code: "INTERNAL_ERROR",
      status: 500,
    });
  });

  it("converts string to 500 INTERNAL_ERROR with the string as message", () => {
    const result = normalizeError("oops");
    expect(result).toEqual({
      message: "oops",
      code: "INTERNAL_ERROR",
      status: 500,
    });
  });

  it("converts null to 500 UNKNOWN_ERROR", () => {
    const result = normalizeError(null);
    expect(result).toEqual({
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      status: 500,
    });
  });

  it("converts undefined to 500 UNKNOWN_ERROR", () => {
    const result = normalizeError(undefined);
    expect(result).toEqual({
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      status: 500,
    });
  });

  it("converts a plain number to 500 UNKNOWN_ERROR", () => {
    const result = normalizeError(42);
    expect(result.code).toBe("UNKNOWN_ERROR");
    expect(result.status).toBe(500);
  });

  it("converts a plain object to 500 UNKNOWN_ERROR", () => {
    const result = normalizeError({ foo: "bar" });
    expect(result.code).toBe("UNKNOWN_ERROR");
    expect(result.status).toBe(500);
  });

  it("does not leak stack traces (result has no stack property)", () => {
    const err = new Error("secret internal details");
    const result = normalizeError(err);
    expect(result).not.toHaveProperty("stack");
    expect(Object.keys(result).sort()).toEqual(["code", "message", "status"]);
  });
});
