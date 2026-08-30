# ---- Frontend build stage ----
FROM node:24-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- Runtime: serve with a minimal static server ----
FROM node:24-alpine AS frontend-runtime
ENV NODE_ENV=production
WORKDIR /app
RUN npm install -g serve@28.9.0
COPY --from=frontend-build /app/dist ./dist
# serve the static build; in production behind a reverse proxy that also
# handles /api/v1 → backend:3000
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
