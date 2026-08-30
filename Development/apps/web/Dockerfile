# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy packages and apps package.json for workspace install
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/web/ ./apps/web/

# Inject build args as ENV before Vite build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build shared types then Web
RUN npm run build -w @agnidrishti/shared-types
RUN npm run build -w @agnidrishti/web

# Production stage - Nginx
FROM nginx:alpine AS production

# Copy built artifacts from Vite output (dist folder in apps/web)
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Custom nginx config to handle React Router SPA fallbacks
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
