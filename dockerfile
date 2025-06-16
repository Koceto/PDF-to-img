[⚠️ Suspicious Content] # Use Node.js with Alpine for smaller image
FROM node:18-alpine

# Install system dependencies for PDF processing and curl for health check
RUN apk add --no-cache \
    ghostscript \
    imagemagick \
    poppler-utils \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for TypeScript build)
RUN npm ci

# Copy application code
COPY . .

# Create directories for uploads and output
RUN mkdir -p uploads output

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build (optional optimization)
RUN npm ci --omit=dev && npm cache clean --force

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