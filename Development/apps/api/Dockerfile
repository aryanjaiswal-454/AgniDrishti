# =========================
# Build stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy workspace package.json files
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/api/ ./apps/api/

# Build shared types first, then API
RUN npm run build -w @agnidrishti/shared-types
RUN npm run build -w @agnidrishti/api


# =========================
# Production stage
# =========================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy root package configuration
COPY package*.json ./

# Copy workspace package.json files
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built shared types
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy database migrations
COPY --from=builder /app/apps/api/src/db/migrations ./apps/api/dist/db/migrations

# IMPORTANT:
# Copy Aiven CA certificate into the FINAL production image
COPY --from=builder /app/apps/api/ca.pem ./apps/api/ca.pem

# Expose Render's API port
EXPOSE 3001

# Start API
CMD ["node", "apps/api/dist/index.js"]