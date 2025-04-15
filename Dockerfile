# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables if needed (e.g., NEXT_PUBLIC_API_URL)
# ENV NEXT_PUBLIC_API_URL=your_api_url

RUN npm run build

# Prune development dependencies
RUN npm prune --production

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Add pm2 globally
RUN npm install -g pm2

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# Copy the ecosystem config and scripts
# Copy ecosystem.config.cjs from the current build context (it's not in the builder stage)
COPY --chown=nextjs:nodejs ecosystem.config.cjs ./
# Copy scripts directory FROM THE BUILDER STAGE
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 4001

ENV PORT=4001

# Use pm2-runtime to start processes defined in ecosystem.config.cjs
CMD ["pm2-runtime", "ecosystem.config.cjs"]

# PREVIOUS CMD:
# # server.js is created by next build from the standalone output
# # https://nextjs.org/docs/pages/api-reference/next-config-js/output
# CMD ["node", "server.js"] 