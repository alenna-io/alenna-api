# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# Copy Prisma schema (needed for postinstall hook)
COPY prisma ./prisma

# Install pnpm and dependencies
RUN npm install -g pnpm@9.0.0
RUN pnpm install --no-frozen-lockfile

# Copy rest of source code
COPY . .

# Build the application
RUN pnpm run build

# Remove dev dependencies
RUN pnpm prune --prod

# Expose port
EXPOSE 8080

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
