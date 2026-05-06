FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/atlas/package.json packages/atlas/package.json
COPY packages/atlas/webui/package.json packages/atlas/webui/package.json
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build -w @a5c-ai/atlas
RUN npm run build -w @a5c-ai/atlas-webui

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/atlas ./packages/atlas
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@a5c-ai/atlas-webui"]
