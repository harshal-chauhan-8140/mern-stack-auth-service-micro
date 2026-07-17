FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:26-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY --from=builder /app/dist ./

# Static assets (served via express.static), including the JWKS the auth
# middleware fetches to verify access tokens. Not part of the compiled dist.
COPY --from=builder /app/public ./public

EXPOSE 5500

CMD ["node", "server.js"]