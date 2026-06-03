FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation pulseaudio \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV AGENT_SOCKET_PATH=/tmp/jitsi-agent.sock

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts
COPY bin ./bin
COPY src ./src

CMD ["node", "bin/sidecar.mjs"]
