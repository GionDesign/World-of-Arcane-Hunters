# World of Claudecraft game server — serves the built client, REST API and WebSocket
# world on one port. Pair with a postgres service (see docker-compose.yml).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY .browserslistrc tsconfig.json vite.config.ts index.html admin.html play.html guide.html ./
COPY src ./src
COPY server ./server
COPY bot ./bot
COPY headless ./headless
COPY scripts ./scripts
COPY public ./public
# Optional private extensions live under ./private. Public checkouts contain only
# a placeholder, so builds still fall back to public stubs; deploys can clone the
# private bot detector into private/bot_detector before this Docker build.
COPY private ./private
# Public client config is inlined into the bundle at build time (Vite reads
# VITE_* from the environment). Empty defaults keep optional UI disabled:
# Turnstile widget off. Passed through from compose build args.
ARG VITE_TURNSTILE_SITEKEY=""
# Fork brand URLs: injected at build time so the deployed bundle carries real
# links without source edits. Defaults to TODO- placeholders (safe for dev/CI).
# Set these as --build-arg in docker build (see .github/workflows/deploy.yml)
# using GitHub Actions repository variables.
ARG VITE_SITE_URL="https://TODO-your-domain.com"
ARG VITE_DISCORD_URL="https://discord.gg/TODO"
ARG VITE_DONATE_URL="https://github.com/sponsors/TODO"
# Analytics IDs: leave empty to strip all analytics from the build output.
# Set as --build-arg via GitHub Actions repo variables to enable your own tracking.
# VITE_GA_ID:         Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX)
# VITE_META_PIXEL_ID: Meta (Facebook) Pixel numeric ID
ARG VITE_GA_ID=""
ARG VITE_META_PIXEL_ID=""
RUN VITE_TURNSTILE_SITEKEY="$VITE_TURNSTILE_SITEKEY" \
    npm run build && cp -a dist/media ./media-build && rm -rf dist/media && npm run build:server && npm run build:bot

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/media-build ./media-build
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/dist-bot ./dist-bot
RUN mkdir -p /app/dist/media && chown -R node:node /app/dist/media
EXPOSE 8787
USER node
CMD ["sh", "-c", "mkdir -p /app/dist/media && node -e \"require('fs').cpSync('/app/media-build', '/app/dist/media', { recursive: true, force: true })\" && node dist-server/server.cjs"]
