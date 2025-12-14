FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=optional --ignore-scripts && \
    npm cache clean --force

COPY src ./src
COPY prisma ./prisma
COPY nest-cli.json tsconfig.json tsconfig.build.json ./

ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
RUN npx prisma generate

RUN npm run build

FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --omit=dev --omit=optional && \
    npm cache clean --force && \
    rm -rf /root/.npm

COPY prisma ./prisma
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
RUN npx prisma generate && \
    rm -rf /root/.npm

FROM node:22-alpine AS pruner
WORKDIR /app

RUN wget -qO- https://gobinaries.com/tj/node-prune | sh

COPY --from=deps /app/node_modules ./node_modules

RUN node-prune && \
    find ./node_modules -name "*.md" -o -name "*.markdown" -o -name "*.mkd" | xargs rm -f 2>/dev/null || true && \
    find ./node_modules -name "*.ts" -not -path "*/node_modules/.prisma/*" -not -path "*/node_modules/@prisma/*" | xargs rm -f 2>/dev/null || true && \
    find ./node_modules -name "*.d.ts" -not -path "*/node_modules/.prisma/*" -not -path "*/node_modules/@prisma/*" | xargs rm -f 2>/dev/null || true && \
    find ./node_modules -name "*.map" | xargs rm -f 2>/dev/null || true && \
    find ./node_modules -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name "docs" -o -name "documentation" -o -name "examples" -o -name "example" -o -name "coverage" -o -name ".github" -o -name "benchmark" -o -name "man" \) -exec rm -rf {} + 2>/dev/null || true

FROM node:22-alpine AS production
WORKDIR /app

RUN apk add --no-cache dumb-init openssl && \
    rm -rf /var/cache/apk/*

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=pruner --chown=nodejs:nodejs /app/node_modules ./node_modules

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

COPY --chown=nodejs:nodejs package*.json ./

RUN rm -rf /tmp/* /root/.npm /home/nodejs/.npm 2>/dev/null || true

USER nodejs

EXPOSE 4000
CMD ["dumb-init", "node", "dist/main"]
