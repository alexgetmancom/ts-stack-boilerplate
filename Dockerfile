FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY tsconfig.json biome.json ./
COPY src/ ./src/

RUN pnpm run build

FROM node:22-alpine AS runner

WORKDIR /usr/src/app

RUN apk add --no-cache ffmpeg

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist

ENV NODE_ENV=production
ENV ENABLE_BOT_POLLING=true
ENV ENABLE_HTTP_SERVER=true

CMD ["node", "dist/src/index.js"]
