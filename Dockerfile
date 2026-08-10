# ---- Build stage: install production deps ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- Runtime stage: minimal image ----
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Local storage adapter writes uploaded files here
RUN mkdir -p /app/uploads && chown -R app:app /app

USER app
EXPOSE 3000

CMD ["node", "src/server.js"]
