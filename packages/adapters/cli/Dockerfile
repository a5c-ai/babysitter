FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/adapters/ ./packages/adapters/
COPY packages/sdk/ ./packages/sdk/
COPY packages/atlas/ ./packages/atlas/
RUN npm install --workspace=packages/adapters/cli --legacy-peer-deps --ignore-scripts 2>/dev/null; exit 0
RUN npm run build --workspace=@a5c-ai/adapters-cli 2>/dev/null; exit 0

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/adapters ./packages/adapters
COPY --from=build /app/packages/sdk ./packages/sdk
COPY --from=build /app/packages/atlas ./packages/atlas
COPY --from=build /app/package.json ./

ENTRYPOINT ["node", "packages/adapters/cli/dist/index.js"]
