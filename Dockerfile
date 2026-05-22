FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_STRAPI_API_URL
ARG NEXT_PUBLIC_STRAPI_MEDIA_URL
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
ENV NEXT_PUBLIC_STRAPI_API_URL=$NEXT_PUBLIC_STRAPI_API_URL
ENV NEXT_PUBLIC_STRAPI_MEDIA_URL=$NEXT_PUBLIC_STRAPI_MEDIA_URL
ENV NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
RUN mkdir -p .next/cache/images && chown -R appuser:appgroup .next
USER appuser
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3000"]
