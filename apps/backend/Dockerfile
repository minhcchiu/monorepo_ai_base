# Production-Ready Multi-Stage Dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Copy package files
# NOTE (monorepo): build context vẫn là apps/backend (standalone). Backend hiện chưa import
# package workspace nào nên cài độc lập được. Nếu sau này backend dùng @pp09base/*, cần đổi build
# context sang repo root + dùng `pnpm deploy --filter`.
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile=false

# Copy source code
COPY . .

# Build application
RUN pnpm build

# ============================================================================
# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Enable pnpm via corepack
RUN corepack enable

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile=false && pnpm store prune

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
