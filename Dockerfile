FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY vendor ./vendor
RUN npm ci

COPY src ./src
COPY tsconfig.json ./
RUN npm run build

FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/vendor ./vendor
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 1071

CMD ["node", "dist/server.js"]
