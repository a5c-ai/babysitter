import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { writeFileAtomic } from "../storage/atomic";
import { getTasksDir } from "../storage/paths";
import { BlobWriteOptions, TaskBuildContext } from "./types";

const DEFAULT_TEXT_ENCODING: BufferEncoding = "utf8";
const DEFAULT_JSON_EXTENSION = ".json";
const MAX_BLOB_BASENAME_LENGTH = 128;
const HASH_SUFFIX_LENGTH = 10;

export interface CreateTaskBuildContextOptions {
  runId: string;
  runDir: string;
  effectId: string;
  invocationKey: string;
  taskId: string;
  label?: string;
}

export function createTaskBuildContext(options: CreateTaskBuildContextOptions): TaskBuildContext {
  const runId = mustBeNonEmpty(options.runId, "runId");
  const runDir = path.resolve(mustBeNonEmpty(options.runDir, "runDir"));
  const effectId = mustBeNonEmpty(options.effectId, "effectId");
  const invocationKey = mustBeNonEmpty(options.invocationKey, "invocationKey");
  const taskId = mustBeNonEmpty(options.taskId, "taskId");
  const tasksRoot = getTasksDir(runDir);
  const taskDir = path.join(tasksRoot, effectId);
  const normalizedLabel = normalizeLabel(options.label);
  const labels = normalizedLabel ? [normalizedLabel] : [];
  const ctx: TaskBuildContext = {
    effectId,
    invocationKey,
    taskId,
    runId,
    runDir,
    taskDir,
    tasksDir: tasksRoot,
    label: normalizedLabel,
    labels,
    async createBlobRef(name, value, blobOptions) {
      const prepared = prepareBlobContents(value, blobOptions);
      const blobName = buildBlobFileName(name, prepared.defaultExtension, prepared.contents);
      const blobDir = path.join(taskDir, "blobs");
      await fs.mkdir(blobDir, { recursive: true });
      const blobPath = path.join(blobDir, blobName);
      await writeFileAtomic(blobPath, prepared.contents);
      return toRunRelative(runDir, blobPath);
    },
    toTaskRelativePath(relativePath: string) {
      const normalized = normalizeTaskRelativePath(relativePath);
      const absolute = path.join(taskDir, normalized);
      return toRunRelative(runDir, absolute);
    },
  };
  return Object.freeze(ctx);
}

function mustBeNonEmpty(value: string | undefined, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`TaskBuildContext requires a non-empty ${field}`);
  }
  return value.trim();
}

function normalizeLabel(label?: string): string | undefined {
  if (!label) return undefined;
  const trimmed = label.trim();
  return trimmed.length ? trimmed : undefined;
}

function buildBlobFileName(rawName: string, defaultExtension: string | undefined, contents: Buffer): string {
  const safeName = sanitizeBlobName(rawName, defaultExtension);
  const digest = hashBuffer(contents);
  return appendDigestSuffix(safeName, digest);
}

function sanitizeBlobName(rawName: string, defaultExtension?: string): string {
  if (typeof rawName !== "string") {
    throw new Error("Blob name must be a non-empty string");
  }
  const trimmed = rawName.trim();
  if (!trimmed.length) {
    throw new Error("Blob name must be a non-empty string");
  }
  const normalized = trimmed.replace(/[\\/]+/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  let safe = segments.join("-").replace(/[^a-zA-Z0-9._-]/g, "-");
  safe = safe.replace(/-+/g, "-");
  safe = safe.replace(/^[-.]+/, "").replace(/[-.]+$/, "");
  if (!safe.length) {
    throw new Error("Blob name must include alphanumeric characters");
  }
  if (defaultExtension && !safe.includes(".")) {
    const ext = defaultExtension.startsWith(".") ? defaultExtension : `.${defaultExtension}`;
    safe = `${safe}${ext}`;
  }
  return clampBlobName(safe);
}

function clampBlobName(name: string): string {
  if (name.length <= MAX_BLOB_BASENAME_LENGTH) {
    return name;
  }
  const ext = path.posix.extname(name);
  const base = ext ? name.slice(0, -ext.length) : name;
  const available = Math.max(8, MAX_BLOB_BASENAME_LENGTH - ext.length - HASH_SUFFIX_LENGTH - 1);
  const truncated = base.slice(0, available);
  const suffix = hashString(name);
  return ext ? `${truncated}-${suffix}${ext}` : `${truncated}-${suffix}`;
}

function appendDigestSuffix(name: string, digest: string): string {
  if (!digest) return name;
  const ext = path.posix.extname(name);
  if (!ext) {
    return `${name}-${digest}`;
  }
  return `${name.slice(0, -ext.length)}-${digest}${ext}`;
}

function normalizeTaskRelativePath(value: string): string {
  if (typeof value !== "string") {
    throw new Error("Relative path must be a string");
  }
  const trimmed = value.trim();
  if (!trimmed.length) {
    throw new Error("Relative path must be non-empty");
  }
  if (path.isAbsolute(trimmed)) {
    throw new Error("Task-relative paths must not be absolute");
  }
  const replaced = trimmed.replace(/\\/g, "/");
  const segments = replaced.split("/").filter(Boolean);
  if (!segments.length) {
    throw new Error("Relative path must include a filename");
  }
  const normalized: string[] = [];
  for (const segment of segments) {
    if (segment === ".") continue;
    if (segment === "..") {
      throw new Error("Task-relative paths cannot traverse above the task directory");
    }
    normalized.push(segment);
  }
  if (!normalized.length) {
    throw new Error("Relative path must include a filename");
  }
  return normalized.join("/");
}

function toRunRelative(runDir: string, absolutePath: string): string {
  const relative = path.relative(runDir, absolutePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path ${absolutePath} is not inside run directory ${runDir}`);
  }
  return relative.split(path.sep).join("/");
}

function hashString(value: string): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, HASH_SUFFIX_LENGTH);
}

function hashBuffer(contents: Buffer): string {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

interface PreparedBlob {
  contents: Buffer;
  defaultExtension?: string;
}

function prepareBlobContents(value: unknown, options?: BlobWriteOptions): PreparedBlob {
  const treatAsJson = shouldSerializeAsJson(value, options);
  if (typeof value === "string" && !treatAsJson) {
    const encoding = options?.encoding ?? DEFAULT_TEXT_ENCODING;
    return {
      contents: Buffer.from(value, encoding),
    };
  }
  if (Buffer.isBuffer(value) && !treatAsJson) {
    return {
      contents: value,
    };
  }
  const normalizedValue = value === undefined ? null : value;
  const serialized = JSON.stringify(normalizedValue, null, 2) ?? "null";
  const withNewline = serialized.endsWith("\n") ? serialized : `${serialized}\n`;
  return {
    contents: Buffer.from(withNewline, DEFAULT_TEXT_ENCODING),
    defaultExtension: DEFAULT_JSON_EXTENSION,
  };
}

function shouldSerializeAsJson(value: unknown, options?: BlobWriteOptions): boolean {
  if (options?.asJson !== undefined) {
    return options.asJson;
  }
  return !(typeof value === "string" || Buffer.isBuffer(value));
}
