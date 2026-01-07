FROM node:20-alpine

# Install common dependencies that MCP servers might need
# Note: Only Chromium is available in Alpine; Firefox/WebKit require Debian
RUN apk add --no-cache \
	chromium \
	nss \
	freetype \
	harfbuzz \
	ca-certificates \
	ttf-freefont \
	python3 \
	make \
	g++ \
	libstdc++ \
	libgcc \
	bash

# Set Chrome path for Playwright and Puppeteer
ENV CHROME_BIN=/usr/bin/chromium-browser \
	CHROME_PATH=/usr/lib/chromium/ \
	PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
	PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser \
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY . .

EXPOSE 3099

CMD ["node", "server.js"]
