FROM node:20-alpine AS build
WORKDIR /app
COPY packages/krate/core/package.json ./
RUN printf '{"type":"module"}\n' > /tmp/pkg-type.json
RUN npm install --omit=dev --ignore-scripts 2>/dev/null; exit 0
COPY packages/krate/core/src ./src
COPY packages/krate/core/bin ./bin
COPY packages/krate/core/scripts ./scripts
COPY packages/krate/core/dist ./dist
COPY packages/krate/core/docs ./docs
COPY packages/krate/core/examples ./examples
COPY packages/krate/core/tests ./tests

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache ca-certificates curl \
    && curl -fsSL -o /usr/local/bin/kubectl \
       https://dl.k8s.io/release/v1.32.2/bin/linux/amd64/kubectl \
    && chmod +x /usr/local/bin/kubectl
ENV NODE_ENV=production
ENV PORT=3080
COPY --from=build /app/package.json ./
COPY --from=build /app/src ./src
COPY --from=build /app/bin ./bin
COPY --from=build /app/dist ./dist
COPY --from=build /app/docs ./docs
COPY --from=build /app/examples ./examples
EXPOSE 3080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "bin/krate-server.mjs"]
