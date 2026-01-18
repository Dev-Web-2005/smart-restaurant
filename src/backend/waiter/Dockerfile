# Dockerfile for Waiter Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and build shared module first
COPY shared/package*.json shared/tsconfig*.json ./shared/
WORKDIR /app/shared
RUN npm ci
COPY shared/src ./src
RUN npm run build

# Now build the waiter service
WORKDIR /app/waiter
COPY waiter/package*.json waiter/tsconfig*.json waiter/nest-cli.json ./
RUN npm ci && \
    npm install -g @nestjs/cli

# Copy source code
COPY waiter/src ./src

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy shared built files
COPY --from=builder /app/shared /app/shared

# Copy waiter service
COPY waiter/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application and node_modules from builder
COPY --from=builder /app/waiter/dist ./dist
COPY --from=builder /app/waiter/node_modules ./node_modules

# Create non-root user and set permissions for all log folders
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    mkdir -p logs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 8088

# Start application
CMD ["node", "dist/waiter/src/main"]
