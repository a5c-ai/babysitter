FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/kradle/web/package.json ./packages/kradle/web/
COPY packages/kradle/sdk/package.json ./packages/kradle/sdk/
COPY packages/kradle/core/package.json ./packages/kradle/core/
RUN npm install --workspace=packages/kradle/web --legacy-peer-deps --ignore-scripts 2>/dev/null; exit 0

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/kradle/web ./packages/kradle/web
COPY packages/kradle/sdk ./packages/kradle/sdk
COPY packages/kradle/core/src ./packages/kradle/core/src
COPY packages/kradle/core/package.json ./packages/kradle/core/
# The org-home WarRoom imports the prebuilt commander library artifact via a
# repo-root-relative path (apps/commander/dist-lib). It lives outside
# packages/kradle so it must be copied into the build context explicitly, or
# `next build` fails with "Module not found: .../apps/commander/dist-lib/commander.mjs".
COPY apps/commander/dist-lib ./apps/commander/dist-lib
WORKDIR /app/packages/kradle/web
RUN npx next build --webpack

FROM node:20-alpine AS runtime
RUN apk add --no-cache curl \
    && curl -fsSL -o /usr/local/bin/kubectl \
       https://dl.k8s.io/release/v1.32.2/bin/linux/amd64/kubectl \
    && chmod +x /usr/local/bin/kubectl \
    && apk del curl
WORKDIR /app

# Runtime env vars (set via Helm values or ConfigMap):
# KRATE_CONTROLLER_URL - API container URL (set by Helm)
# KRATE_ADMIN_ORG - Admin org slug (set by Helm)
# KRATE_SESSION_SECRET - HMAC secret for cookies (optional)
# ANTHROPIC_API_KEY - For assistant agent (optional)
# ATLAS_BASE_URL - Atlas graph API (optional)

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/packages/kradle/web/.next/standalone ./
COPY --from=build /app/packages/kradle/web/.next/static ./packages/kradle/web/.next/static
EXPOSE 3000
CMD ["node", "packages/kradle/web/server.js"]
