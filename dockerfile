# Build stage
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    ghostscript \
    imagemagick \
    poppler-utils \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    ghostscript \
    imagemagick \
    poppler-utils \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create directories
RUN mkdir -p uploads output

# Change ownership to node user
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]