# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY postcss.config.js tailwind.config.js vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY index.html ./
COPY src/ ./src/

# Build the application
RUN npm run build

# ---- Production Stage ----
FROM nginx:1.27-alpine AS runner

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
