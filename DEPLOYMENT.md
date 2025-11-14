# Fly.io Deployment Guide

## Prerequisites

1. Install Fly.io CLI: `curl -L https://fly.io/install.sh | sh` (or `pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"` on Windows)
2. Sign up/login: `fly auth login`

## Database Setup

You need a PostgreSQL database. Options:

- **Fly.io Postgres**: `fly postgres create`
- **External provider**: Neon, Supabase, etc.

## Deployment Steps

### 1. Create app (one-time)

```bash
fly launch --no-deploy
```

Update `fly.toml` with your app name.

### 2. Set secrets

```bash
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set CLERK_PUBLISHABLE_KEY="pk_live_..."
fly secrets set CLERK_SECRET_KEY="sk_live_..."
```

### 3. Deploy

```bash
fly deploy
```

### 4. Check status

```bash
fly status
fly logs
```

## Configuration Notes

- **Port**: 8080 (Fly.io standard)
- **Region**: Miami (mia) - change in `fly.toml` if needed
- **Memory**: 1GB - increase if needed
- **Auto-migrations**: Runs on startup via `prisma migrate deploy`

