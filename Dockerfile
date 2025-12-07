# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --omit=optional --ignore-scripts

# Copy source code
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts nest-cli.json tsconfig.json tsconfig.build.json ./

# Generate Prisma client
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
RUN npx prisma generate

# Build application
RUN npm run build

# Prune dev dependencies and clean npm cache
RUN npm prune --production --omit=optional && \
    npm cache clean --force

# Production stage
FROM node:24-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --chown=nodejs:nodejs package*.json ./

# Aggressive cleanup to reduce image size (keep .bin for prisma)
RUN find ./node_modules -name "*.md" -delete && \
    find ./node_modules -name "*.ts" -not -path "*/node_modules/.prisma/*" -not -path "*/node_modules/@prisma/*" -delete && \
    find ./node_modules -name "*.map" -delete && \
    find ./node_modules -name "*.d.ts" -not -path "*/node_modules/.prisma/*" -not -path "*/node_modules/@prisma/*" -delete && \
    find ./node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name "docs" -o -name "examples" -o -name "coverage" -o -name ".github" -o -name "benchmark" -o -name "scripts" \) -exec rm -rf {} + 2>/dev/null || true && \
    find ./node_modules -name "*.txt" -o -name "*.yml" -o -name "*.yaml" -o -name "LICENSE*" -o -name "CHANGELOG*" | xargs rm -f 2>/dev/null || true && \
    rm -rf ./node_modules/.cache 2>/dev/null || true && \
    rm -rf /tmp/* /root/.npm /root/.node-gyp 2>/dev/null || true

# Use non-root user
USER nodejs

EXPOSE 4000
CMD ["dumb-init", "node", "dist/src/main"]
