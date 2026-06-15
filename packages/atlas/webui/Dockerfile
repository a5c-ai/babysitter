FROM node:22-alpine AS deps
WORKDIR /app

# Create minimal workspace structure with only atlas packages
COPY package.json ./
COPY packages/atlas/package.json packages/atlas/package.json
COPY packages/atlas/webui/package.json packages/atlas/webui/package.json

# Override root package.json to only include atlas workspaces
# Keep dependencies/overrides that the webui needs for correct resolution
RUN node -e " \
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  pkg.workspaces = ['packages/atlas', 'packages/atlas/*']; \
  delete pkg.devDependencies; \
  delete pkg.overrides; \
  pkg.dependencies = {}; \
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

RUN npm install --ignore-scripts --no-package-lock

FROM deps AS builder
WORKDIR /app
ENV DOCKER_BUILD=1
COPY packages/atlas packages/atlas
COPY library library
COPY docs docs
RUN npm run build -w @a5c-ai/atlas
RUN npm run build -w @a5c-ai/atlas-webui -- --webpack

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/atlas ./packages/atlas

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@a5c-ai/atlas-webui"]
