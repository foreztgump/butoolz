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

# Set environment variables if needed (e.g., NEXT_PUBLIC_API_URL)
# ENV NEXT_PUBLIC_API_URL=your_api_url

# Copy the entire source code context
COPY . .

RUN npm run build

# REMOVED Prune development dependencies
# RUN npm prune --production

# Debug: Check if scripts directory exists before builder stage ends
# RUN echo \"---> Listing /app contents:\" && ls -la /app && echo \"---> Listing /app/scripts contents:\" && ls -la /app/scripts || echo \"---> /app/scripts not found before end of builder stage!\"

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# REMOVED Add pm2 globally
# RUN npm install -g pm2

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

# REMOVED redundant copies
# COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
# COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
# COPY --chown=nextjs:nodejs ecosystem.config.cjs ./

# KEEPING scripts copy for now - Needs confirmation
COPY --chown=nextjs:nodejs scripts ./scripts

USER nextjs

# Change port to 3000 for Coolify
EXPOSE 3000
ENV PORT=3000

# Use standard node start for standalone output
CMD ["node", "server.js"] 