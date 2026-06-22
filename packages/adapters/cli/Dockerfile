# Kradle agent runtime image (adapters-agent).
#
# The CI deploy_kradle job runs `npm ci` and extracts the build-all-dist artifact
# (which builds @a5c-ai/adapters-cli via its own tsc script → ESM) into the build
# context BEFORE this image is built. So packages/adapters/**/dist is already
# present and correct. Do NOT rebuild it in-Docker (the previous Dockerfile did,
# with `2>/dev/null; exit 0`, which silently shipped a broken CJS dist and no
# harness — so no dispatched agent ever ran).
#
# This image installs runtime deps + the coding-agent harness (claude-code) and
# uses the kradle entrypoint wrapper, which runs `adapters launch <harness>
# <provider>` through the JS transport-mux proxy and POSTs results to the run
# callback.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/adapters/ ./packages/adapters/
COPY packages/babysitter-sdk/ ./packages/babysitter-sdk/
COPY packages/atlas/ ./packages/atlas/
# Runtime deps only — dist is already built in the context. Fail loud.
RUN npm install --workspace=packages/adapters/cli --omit=dev --legacy-peer-deps --ignore-scripts
# Sanity: the prebuilt entrypoint must be valid ESM (catches a CJS/ESM regression
# at build time instead of at dispatch time).
RUN node --check packages/adapters/cli/dist/index.js \
 && node --check packages/adapters/cli/kradle-agent-entrypoint.mjs

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# git + ripgrep are commonly required by coding-agent harnesses.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ripgrep ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# The default kradle harness. createAgentJob maps adapter 'claude-code' → 'claude'.
RUN npm install -g @anthropic-ai/claude-code
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/adapters ./packages/adapters
COPY --from=build /app/packages/babysitter-sdk ./packages/babysitter-sdk
COPY --from=build /app/packages/atlas ./packages/atlas
COPY --from=build /app/package.json ./

# createAgentJob overrides command with the wrapper, but default to it too so the
# image is runnable standalone.
ENTRYPOINT ["node", "packages/adapters/cli/kradle-agent-entrypoint.mjs"]
