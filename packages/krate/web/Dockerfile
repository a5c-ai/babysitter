FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/krate/web/package.json ./packages/krate/web/
COPY packages/krate/sdk/package.json ./packages/krate/sdk/
COPY packages/krate/core/package.json ./packages/krate/core/
RUN npm install --workspace=packages/krate/web --legacy-peer-deps --ignore-scripts 2>/dev/null; exit 0

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/krate/web ./packages/krate/web
COPY packages/krate/sdk ./packages/krate/sdk
COPY packages/krate/core/src ./packages/krate/core/src
COPY packages/krate/core/package.json ./packages/krate/core/
WORKDIR /app/packages/krate/web
RUN npx next build --webpack

FROM node:20-alpine AS runtime
RUN apk add --no-cache curl \
    && curl -fsSL -o /usr/local/bin/kubectl \
       https://dl.k8s.io/release/v1.32.2/bin/linux/amd64/kubectl \
    && chmod +x /usr/local/bin/kubectl \
    && apk del curl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/packages/krate/web/.next/standalone ./
COPY --from=build /app/packages/krate/web/.next/static ./packages/krate/web/.next/static
EXPOSE 3000
CMD ["node", "packages/krate/web/server.js"]
