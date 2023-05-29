FROM node:16-slim as builder

RUN mkdir -p /build
WORKDIR /build
COPY . /build

RUN npm ci
RUN npm run build

FROM node:16-slim

RUN mkdir -p /app
WORKDIR /app
COPY --from=builder /build/package*.json ./
COPY --from=builder /build/.build/ ./.build/
RUN npm ci --omit=dev

ENV NODE_OPTIONS="--dns-result-order=ipv4first"

CMD ["node", ".build/index.js"]
