# Soulvolks Frontend

Next.js frontend for [soulvolks.it](https://soulvolks.it).

## Stack
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Docker

## Features
- Club website and events showcase
- Ticket purchase with PayPal integration
- QR code generation and scanning
- Admin dashboard for ticket management
- Blog powered by Strapi CMS

## Development

```bash
npm run dev
```

## Production

Deployed via Docker on a self-hosted VPS.

```bash
docker compose up -d
```

## Environment variables

See `.env.example` for required variables.