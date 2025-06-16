FROM node:20-alpine

WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    python3 \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev

# Install app dependencies
COPY package*.json ./
RUN npm install --only=production

# Bundle app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads && \
    chmod 777 uploads

EXPOSE 3000
CMD [ "npm", "start" ]