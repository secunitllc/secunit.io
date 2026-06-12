# Build stage: Bun (matches package.json packageManager)
FROM oven/bun:1.3-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

# Production: distroless Node (matches engines.node >= 26)
FROM gcr.io/distroless/nodejs26-debian13:nonroot AS runner

WORKDIR /app

COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./package.json

EXPOSE 4321

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

CMD ["./dist/server/entry.mjs"]
