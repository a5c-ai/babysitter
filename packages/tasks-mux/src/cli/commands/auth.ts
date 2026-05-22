import { Command } from "commander";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  GitHubOAuthClient,
  generateSSHKeyPair,
  type GitHubOAuthConfig,
  type SSHKeyPair,
} from "../../auth/index.js";
import {
  loadAuthState,
  saveAuthState,
  clearAuthState,
  isTokenExpired,
  getKeysDir,
  loadClientConfig,
  saveClientConfig,
} from "../auth-store.js";
import { printError } from "../output.js";
import { createCliServerClient, resolveServerUrl, resolveAuthToken } from "../client-config.js";

// ── Types ─────────────────────────────────────────────────────────────────

interface GlobalOpts {
  serverUrl?: string;
  authToken?: string;
  json?: boolean;
  responderDir?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_OAUTH_CONFIG: GitHubOAuthConfig = {
  clientId: process.env.BMUX_GITHUB_CLIENT_ID ?? "",
  clientSecret: process.env.BMUX_GITHUB_CLIENT_SECRET ?? "",
  callbackUrl: "http://localhost:0/callback",
  scopes: ["read:user", "user:email", "read:org", "repo"],
};

// ── Command creation ─────────────────────────────────────────────────────

export function createAuthCommand(): Command {
  const cmd = new Command("auth").description("Authentication and key management");

  cmd.addCommand(createLoginCommand());
  cmd.addCommand(createServerConfigCommand());
  cmd.addCommand(createTokenCommand());
  cmd.addCommand(createLogoutCommand());
  cmd.addCommand(createStatusCommand());
  cmd.addCommand(createKeygenCommand());
  cmd.addCommand(createKeyPushCommand());
  cmd.addCommand(createKeysCommand());

  return cmd;
}

// ── login ────────────────────────────────────────────────────────────────

function createLoginCommand(): Command {
  return new Command("login")
    .description("Authenticate with GitHub OAuth")
    .action(async (_opts, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        const state = randomBytes(16).toString("hex");

        // Create a one-shot local HTTP server to receive the OAuth callback
        const { port, authCode } = await startCallbackServer(state);

        const oauthConfig: GitHubOAuthConfig = {
          ...DEFAULT_OAUTH_CONFIG,
          callbackUrl: `http://localhost:${port}/callback`,
        };
        const oauthClient = new GitHubOAuthClient(oauthConfig);
        const authUrl = oauthClient.getAuthorizationUrl(state);

        // Try to open the browser; fall back to printing the URL
        let browserOpened = false;
        try {
          const { default: open } = await import("open");
          await open(authUrl);
          browserOpened = true;
        } catch {
          // open package not available or failed
        }

        if (!jsonMode) {
          if (browserOpened) {
            console.log("Opening browser for authentication...");
          } else {
            console.log("Open the following URL in your browser to authenticate:");
          }
          console.log(`\n  ${authUrl}\n`);
          console.log("Waiting for callback...");
        }

        // Wait for the authorization code
        const code = await authCode;

        // Exchange code for token and fetch user profile
        const tokenResult = await oauthClient.exchangeCode(code);
        const user = await oauthClient.getUserProfile(tokenResult.accessToken);

        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

        saveAuthState({
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.accessToken, // GitHub OAuth doesn't issue refresh tokens; store access token
          expiresAt,
          user,
        });
        if (allOpts.serverUrl) {
          saveClientConfig({ serverUrl: resolveServerUrl(allOpts.serverUrl) });
        }

        if (jsonMode) {
          console.log(JSON.stringify({ status: "logged_in", user }, null, 2));
        } else {
          console.log(`Logged in as ${user.name} (${user.login})`);
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });
}

function createServerConfigCommand(): Command {
  const cmd = new Command("server").description("Manage the saved tasks-mux server URL");

  cmd
    .command("set")
    .argument("<url>", "Breakpoints-mux server URL")
    .description("Save a default server URL in ~/.tasks-mux/config.json")
    .action((url: string, _opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        saveClientConfig({ serverUrl: resolveServerUrl(url) });

        if (jsonMode) {
          console.log(JSON.stringify({
            status: "saved",
            key: "serverUrl",
            value: resolveServerUrl(url),
            source: "~/.tasks-mux/config.json",
          }));
        } else {
          console.log(`Saved default server URL to ~/.tasks-mux/config.json: ${resolveServerUrl(url)}`);
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("clear")
    .description("Remove the saved default server URL from ~/.tasks-mux/config.json")
    .action((_opts, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        saveClientConfig({ serverUrl: "" });

        if (jsonMode) {
          console.log(JSON.stringify({ status: "cleared", key: "serverUrl", source: "~/.tasks-mux/config.json" }));
        } else {
          console.log("Cleared saved default server URL from ~/.tasks-mux/config.json");
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}

function createTokenCommand(): Command {
  const cmd = new Command("token").description("Manage a saved bearer token for CLI and MCP use");

  cmd
    .command("set")
    .argument("<token>", "Bearer token value")
    .description("Save a bearer token in ~/.tasks-mux/config.json")
    .action((token: string, _opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        saveClientConfig({
          authToken: token,
          serverUrl: allOpts.serverUrl ? resolveServerUrl(allOpts.serverUrl) : undefined,
        });

        if (jsonMode) {
          console.log(JSON.stringify({ status: "saved", source: "~/.tasks-mux/config.json" }));
        } else {
          console.log("Saved bearer token to ~/.tasks-mux/config.json");
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("clear")
    .description("Remove the saved bearer token from ~/.tasks-mux/config.json")
    .action((_opts, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        saveClientConfig({ authToken: "" });

        if (jsonMode) {
          console.log(JSON.stringify({ status: "cleared", source: "~/.tasks-mux/config.json" }));
        } else {
          console.log("Cleared saved bearer token from ~/.tasks-mux/config.json");
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}

// ── logout ───────────────────────────────────────────────────────────────

function createLogoutCommand(): Command {
  return new Command("logout")
    .description("Clear stored authentication tokens")
    .action((_opts, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        clearAuthState();
        saveClientConfig({ authToken: "" });

        if (jsonMode) {
          console.log(JSON.stringify({ status: "logged_out" }));
        } else {
          console.log("Logged out. Authentication tokens cleared.");
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });
}

// ── status ───────────────────────────────────────────────────────────────

function createStatusCommand(): Command {
  return new Command("status")
    .description("Show current authentication status")
    .action(async (_opts, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        const auth = loadAuthState();
        const config = loadClientConfig();
        const token = await resolveAuthToken(allOpts.serverUrl, allOpts.authToken);
        const serverUrl = resolveServerUrl(allOpts.serverUrl);

        if (!token && !auth) {
          if (jsonMode) {
            console.log(JSON.stringify({ authenticated: false }));
          } else {
            console.log("Not authenticated. Use `tasks-mux auth login`, `tasks-mux auth token set`, or BMUX_AUTH_TOKEN.");
          }
          return;
        }

        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const user = await client.get<{
          login: string;
          name: string;
          email?: string;
        }>("/auth/me");
        const expired = auth ? isTokenExpired(auth.expiresAt) : false;
        const source = allOpts.authToken
          ? "flag"
          : process.env.BMUX_AUTH_TOKEN
            ? "BMUX_AUTH_TOKEN"
            : process.env.AUTH_TOKEN
              ? "AUTH_TOKEN"
              : config.authToken
                ? "~/.tasks-mux/config.json"
                : auth
                  ? "~/.tasks-mux/auth.json"
                  : "unknown";

        if (jsonMode) {
          console.log(JSON.stringify({
            authenticated: true,
            expired,
            source,
            user,
            expiresAt: auth?.expiresAt,
            serverUrl,
          }, null, 2));
        } else {
          console.log(`Authenticated as: ${user.name} (${user.login})`);
          if (user.email) {
            console.log(`Email:            ${user.email}`);
          }
          console.log(`Server:           ${serverUrl}`);
          console.log(`Auth source:      ${source}`);
          if (auth?.expiresAt) {
            console.log(`Token expires:    ${auth.expiresAt}`);
          }
          console.log(`Status:           ${expired ? "EXPIRED" : "Active"}`);
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });
}

// ── keygen ───────────────────────────────────────────────────────────────

function createKeygenCommand(): Command {
  return new Command("keygen")
    .description("Generate a new Ed25519 SSH key pair")
    .action((_opts, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        const keyPair: SSHKeyPair = generateSSHKeyPair();

        // Save private key to ~/.tasks-mux/keys/{fingerprint}.pem
        const keysDir = getKeysDir();
        mkdirSync(keysDir, { recursive: true });

        const safeName = keyPair.fingerprint.replace(/[/:]/g, "_");
        const privateKeyPath = join(keysDir, `${safeName}.pem`);
        writeFileSync(privateKeyPath, keyPair.privateKey, {
          encoding: "utf-8",
          mode: 0o600,
        });

        if (jsonMode) {
          console.log(JSON.stringify({
            publicKey: keyPair.publicKey,
            fingerprint: keyPair.fingerprint,
            algorithm: keyPair.algorithm,
            privateKeyPath,
            createdAt: keyPair.createdAt,
          }, null, 2));
        } else {
          console.log(`Key pair generated successfully.`);
          console.log(`  Fingerprint:    ${keyPair.fingerprint}`);
          console.log(`  Algorithm:      ${keyPair.algorithm}`);
          console.log(`  Private key:    ${privateKeyPath}`);
          console.log(`  Created:        ${keyPair.createdAt}`);
          console.log(``);
          console.log(`Public key:`);
          console.log(keyPair.publicKey);
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });
}

// ── key-push ─────────────────────────────────────────────────────────────

function createKeyPushCommand(): Command {
  return new Command("key-push")
    .description("Push public key to repository")
    .option("--pr", "Create a pull request with the key", false)
    .option("--key <fingerprint>", "Fingerprint of the key to push (defaults to most recent)")
    .action(async (opts, command: Command) => {
      const allOpts: GlobalOpts & { pr?: boolean; key?: string } = command.optsWithGlobals();
      const localOpts = opts as { pr?: boolean; key?: string };
      const jsonMode = allOpts.json === true;
      const serverUrl = resolveServerUrl(allOpts.serverUrl);

      try {
        const keysDir = getKeysDir();
        const keyFiles = listKeyFiles(keysDir);

        if (keyFiles.length === 0) {
          throw new Error("No keys found. Run `tasks-mux auth keygen` first.");
        }

        // Find the key to push
        let keyFile: string;
        if (localOpts.key) {
          const safeName = localOpts.key.replace(/[/:]/g, "_");
          const match = keyFiles.find((f) => f.includes(safeName));
          if (!match) {
            throw new Error(`Key not found for fingerprint: ${localOpts.key}`);
          }
          keyFile = match;
        } else {
          // Use the most recently created key
          keyFile = keyFiles[keyFiles.length - 1];
        }

        // For key-push, we need to communicate with the server
        if (localOpts.pr) {
          const response = await fetch(`${serverUrl}/api/v1/keys`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keyFile: keyFile.replace(".pem", ""),
              createPR: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }

          const result = (await response.json()) as { prUrl?: string; message?: string };

          if (jsonMode) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            if (result.prUrl) {
              console.log(`Pull request created: ${result.prUrl}`);
            } else {
              console.log(result.message ?? "Key pushed successfully.");
            }
          }
        } else {
          if (jsonMode) {
            console.log(JSON.stringify({ keyFile, status: "ready" }, null, 2));
          } else {
            console.log(`Key ready to push: ${keyFile}`);
            console.log(`Use --pr to create a pull request.`);
          }
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });
}

// ── keys ─────────────────────────────────────────────────────────────────

function createKeysCommand(): Command {
  return new Command("keys")
    .description("List local SSH keys")
    .action((_opts, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        const keysDir = getKeysDir();
        const keyFiles = listKeyFiles(keysDir);

        if (keyFiles.length === 0) {
          if (jsonMode) {
            console.log(JSON.stringify([]));
          } else {
            console.log("No keys found. Run `tasks-mux auth keygen` to generate a key pair.");
          }
          return;
        }

        const keys = keyFiles.map((file) => {
          const filePath = join(keysDir, file);
          const stats = statSync(filePath);
          const fingerprint = file.replace(".pem", "").replace(/_/g, "/").replace(/SHA256\//, "SHA256:");
          return {
            fingerprint,
            file,
            createdAt: stats.birthtime.toISOString(),
          };
        });

        if (jsonMode) {
          console.log(JSON.stringify(keys, null, 2));
        } else {
          console.log("Local SSH keys:\n");
          for (const key of keys) {
            console.log(`  ${key.fingerprint}`);
            console.log(`    File:    ${key.file}`);
            console.log(`    Created: ${key.createdAt}`);
            console.log("");
          }
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });
}

// ── Internal helpers ─────────────────────────────────────────────────────

/**
 * Start a temporary HTTP server to receive the OAuth callback.
 * Returns the port and a promise that resolves with the authorization code.
 */
function startCallbackServer(
  expectedState: string,
): Promise<{ port: number; authCode: Promise<string> }> {
  return new Promise((resolveSetup) => {
    let resolveCode: (code: string) => void;
    let rejectCode: (error: Error) => void;
    const authCode = new Promise<string>((resolve, reject) => {
      resolveCode = resolve;
      rejectCode = reject;
    });

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost`);

      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (state !== expectedState) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<h1>State mismatch. Authentication failed.</h1>");
          rejectCode(new Error("OAuth state mismatch"));
          server.close();
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<h1>No authorization code received.</h1>");
          rejectCode(new Error("No authorization code in callback"));
          server.close();
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Authentication successful!</h1><p>You can close this window.</p>");
        resolveCode(code);

        // Close the server after a brief delay to let the response flush
        setTimeout(() => server.close(), 500);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr !== null ? addr.port : 0;
      resolveSetup({ port, authCode });
    });
  });
}

/**
 * List .pem files in the keys directory.
 */
function listKeyFiles(keysDir: string): string[] {
  try {
    return readdirSync(keysDir)
      .filter((f) => f.endsWith(".pem"))
      .sort();
  } catch {
    return [];
  }
}
