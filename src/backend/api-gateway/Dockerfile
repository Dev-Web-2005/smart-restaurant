# Dockerfile for API Gateway Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and build shared module first
COPY shared/package*.json shared/tsconfig*.json ./shared/
WORKDIR /app/shared
RUN npm ci
COPY shared/src ./src
RUN npm run build

# Now build the api-gateway service
WORKDIR /app/api-gateway
COPY api-gateway/package*.json api-gateway/tsconfig*.json api-gateway/nest-cli.json ./
RUN npm ci && \
    npm install -g @nestjs/cli

# Copy source code
COPY api-gateway/src ./src

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy shared built files
COPY --from=builder /app/shared /app/shared

# Copy api-gateway service
COPY api-gateway/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application and node_modules from builder
COPY --from=builder /app/api-gateway/dist ./dist
COPY --from=builder /app/api-gateway/node_modules ./node_modules

# Create non-root user and set permissions for all log folders
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    mkdir -p logs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 8888

# Start application
CMD ["node", "dist/api-gateway/src/main"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8888/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/api-gateway/src/main.js"]
