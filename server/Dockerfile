# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDeps for tsx and types)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Type-check the code
RUN npx tsc --noEmit

# ---- Production Stage ----
FROM node:22-alpine AS runner
WORKDIR /app

# Install build dependencies for better-sqlite3 native module
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package.json ./

# Install all dependencies (including tsx for runtime)
RUN npm ci && npm cache clean --force

# Copy source code from builder
COPY --from=builder /app/src ./src

# Create data directory for SQLite database (persisted via volume)
RUN mkdir -p /app/data

EXPOSE 3001

# Use tsx to run TypeScript directly (handles ESM/CJS transparently)
CMD ["npx", "tsx", "src/index.ts"]
