FROM node:20-slim

# Install system dependencies for Playwright browsers
# Using Debian-based image for better browser support
RUN apt-get update && \
	apt-get install -y --no-install-recommends \
	libnss3 \
	libnspr4 \
	libatk1.0-0 \
	libatk-bridge2.0-0 \
	libcups2 \
	libdrm2 \
	libdbus-1-3 \
	libxkbcommon0 \
	libxcomposite1 \
	libxdamage1 \
	libxfixes3 \
	libxrandr2 \
	libgbm1 \
	libasound2 \
	libpango-1.0-0 \
	libcairo2 \
	ca-certificates \
	fonts-liberation \
	libappindicator3-1 \
	xdg-utils \
	wget \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Playwright MCP
# Playwright will download its own browsers (Chromium, Firefox, WebKit)
RUN npm install && \
	npx playwright install --with-deps || true

EXPOSE 3004

# Run Playwright MCP in HTTP mode
CMD ["npx", "@playwright/mcp@latest", "--port", "3004"]
