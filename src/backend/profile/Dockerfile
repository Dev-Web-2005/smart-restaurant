# Dockerfile for Profile Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and build shared module first
COPY shared/package*.json shared/tsconfig*.json ./shared/
WORKDIR /app/shared
RUN npm ci
COPY shared/src ./src
RUN npm run build

# Now build the profile service
WORKDIR /app/profile
COPY profile/package*.json profile/tsconfig*.json profile/nest-cli.json ./
RUN npm ci && \
    npm install -g @nestjs/cli

# Copy source code
COPY profile/src ./src

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy shared built files
COPY --from=builder /app/shared /app/shared

# Copy profile service
COPY profile/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application and node_modules from builder
COPY --from=builder /app/profile/dist ./dist
COPY --from=builder /app/profile/node_modules ./node_modules

# Create non-root user and set permissions for all log folders
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    mkdir -p logs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 8081

# Start application
CMD ["node", "dist/profile/src/main"]
