FROM node:24-alpine AS builder

# Enable Corepack and prepare pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json biome.json ./
COPY src/ ./src/

RUN pnpm run build

FROM node:24-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist

# Create database volume directory and set ownership to node user
RUN mkdir -p data && chown -R node:node /usr/src/app

USER node

ENV NODE_ENV=production
ENV BOT_MODE=webhook
ENV BIND_HOST=0.0.0.0
ENV PORT=8080

CMD ["node", "dist/src/index.js"]
