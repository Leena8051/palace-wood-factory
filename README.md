# 🪵 Palace Wood Factory — ERP System

An internal ERP system built for Palace Wood Factory, a Saudi-based woodworking manufacturer. It covers the full order lifecycle from customer intake to delivery, complaints, maintenance, payments, and reporting.

## Features

- **Customers** — manage contacts, types, and history
- **Orders** — multi-stage production workflow (Design → Production → Delivery)
- **Complaints** — Kanban board with response threads
- **Maintenance** — scheduling, technician assignment, and customer sign-off
- **Payments** — payment ledger per order
- **Reports** — revenue charts, KPIs, and complaint breakdowns
- **Settings** — factory info and configuration
- **Bilingual** — full Arabic/English support with RTL layout

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | SQLite (dev) / Turso (production) via Prisma 7 |
| Auth | Auth.js v5 (Credentials + JWT) |
| Styling | Tailwind CSS v4 |
| i18n | next-intl 4 (ar / en) |
| Charts | Recharts |
