# Dockerfile for Order Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and build shared module first
COPY shared/package*.json shared/tsconfig*.json ./shared/
WORKDIR /app/shared
RUN npm ci
COPY shared/src ./src
RUN npm run build

# Now build the order service
WORKDIR /app/order
COPY order/package*.json order/tsconfig*.json order/nest-cli.json ./
RUN npm install --legacy-peer-deps && \
    npm install -g @nestjs/cli

# Copy source code
COPY order/src ./src

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy shared built files
COPY --from=builder /app/shared /app/shared

# Copy order service
COPY order/package*.json ./
RUN npm install --legacy-peer-deps --only=production && npm cache clean --force

# Copy built application and node_modules from builder
COPY --from=builder /app/order/dist ./dist
COPY --from=builder /app/order/node_modules ./node_modules

# Create non-root user and set permissions for all log folders
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    mkdir -p logs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 8087

# Start application
CMD ["node", "dist/order/src/main"]
