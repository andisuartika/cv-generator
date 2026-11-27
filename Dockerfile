# Production image: Next.js plus the headless Chromium used for server PDFs.
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production PORT=3000 PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
  && npx playwright install --with-deps --only-shell chromium \
  && apt-get update \
  && apt-get install -y --no-install-recommends fonts-noto-core fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/* \
  && npm cache clean --force
COPY next.config.ts ./
COPY public ./public
COPY --from=build --chown=node:node /app/.next ./.next
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
