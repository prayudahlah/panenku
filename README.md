# Panenku

Sistem Informasi Marketplace Berfokus pada Transaksi B2B Hasil Panen dengan Negosiasi dan Kemitraan/Kontrak.

## Tech Stack

- **Frontend:** React.js (JavaScript)
- **Backend:** Elysia.js (TypeScript)
- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM
- **Auth:** Session-based (`@elysiajs/session`)
- **Container:** Docker
- **Reverse Proxy:** Nginx

## Environment

| File | Penggunaan |
|------|-----------|
| `.env.local` | Development all-in-one (localhost) |
| `.env.distributed` | Development 4 laptop via Tailscale |
| `.env.production` | Production deployment |

## Struktur

```
panenku/
├── frontend/                     # React SPA
├── backend/                      # Elysia REST API
├── compose/                      # Docker Compose files
│   ├── compose.yml               # All-in-one
│   ├── compose.db.yml            # PostgreSQL
│   ├── compose.backend.yml       # Backend API
│   ├── compose.frontend.yml      # Frontend
│   └── compose.proxy.yml         # Nginx reverse proxy
├── docker/
│   ├── nginx/default.conf
│   └── postgres/init.sql
├── scripts/
│   ├── panenku.sh                # Linux/macOS CLI
│   └── panenku.ps1               # Windows PowerShell CLI
├── tests/
│   ├── api/                      # Blackbox API tests
│   └── e2e/                      # Playwright E2E tests
└── .env.*                        # Environment configs
```

## Quick Start (Local Dev)

```bash
./scripts/panenku.sh dev up --build
```

## Distributed Dev (Tailscale)

```bash
# Laptop 1 — Database
./scripts/panenku.sh distributed db up

# Laptop 2 — Backend
./scripts/panenku.sh distributed be up --build

# Laptop 3 — Frontend
./scripts/panenku.sh distributed fe up --build

# Laptop 4 — Nginx
./scripts/panenku.sh distributed proxy up
```

## Commands

```bash
./scripts/panenku.sh <mode> <action> [--build]

# mode:       dev | distributed
# action:     up | down | logs
# distributed service: db | be | fe | proxy
```
