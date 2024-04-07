FROM node:21 AS base

FROM base AS deps
WORKDIR /app
COPY package*.json .
RUN npm ci

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build
RUN node compress.mjs

RUN chown -R nextjs:nodejs .next

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD HOSTNAME="0.0.0.0" npm run start
