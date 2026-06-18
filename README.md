# Lok Lagbe? | লোক লাগবে?
### Full-Stack Service Marketplace

A home service marketplace for Bangladesh where customers hire verified professionals for plumbing, electrical, cleaning, and more.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase
- **Database**: PostgreSQL (Supabase) with RLS
- **Auth**: Supabase Auth (JWT-based)

## Setup

### 1. Install
```bash
npm install
```

### 2. Supabase
- Create project at supabase.com
- Run `supabase/schema.sql` in SQL Editor
- Copy URL and anon key

### 3. Environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials
```

### 4. Create Admin
- Sign up at /signup
- In Supabase → profiles table → set your role to 'admin'

### 5. Run
```bash
npm run dev
```

## Roles
| Role | Dashboard | Access |
|------|-----------|--------|
| Admin | /admin | All users, orders, revenue |
| Vendor | /vendor | Add services, manage jobs |
| User | /user | Browse, book, order history |

## Database ERD
```
profiles ──► services ──► orders
    │                        │
    └────────────────────────┘
categories ──► services
```

## Mock Payment
Sandbox checkout with test card 4242 4242 4242 4242. No real payment processed.
