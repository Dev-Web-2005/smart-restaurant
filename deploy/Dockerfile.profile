# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared module first
COPY src/backend/shared ./src/backend/shared

# Copy profile source
COPY src/backend/profile/package*.json ./src/backend/profile/
COPY src/backend/profile ./src/backend/profile

# Install dependencies and build shared module
WORKDIR /app/src/backend/shared
RUN npm install && npm run build

# Install dependencies and build profile
WORKDIR /app/src/backend/profile
RUN npm install
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy shared module
COPY --from=builder /app/src/backend/shared/package*.json ./src/backend/shared/
COPY --from=builder /app/src/backend/shared/dist ./src/backend/shared/dist
COPY --from=builder /app/src/backend/shared/node_modules ./src/backend/shared/node_modules

# Copy profile service
COPY --from=builder /app/src/backend/profile/package*.json ./src/backend/profile/
COPY --from=builder /app/src/backend/profile/dist ./src/backend/profile/dist
COPY --from=builder /app/src/backend/profile/node_modules ./src/backend/profile/node_modules

WORKDIR /app/src/backend/profile

# Expose port
EXPOSE 8081

# Start application
CMD ["npm", "run", "start:prod"]
