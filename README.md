# Kudrat Humane Living Trust — kudrathumane.org

Website and admin system for Kudrat Humane Living Trust, an NGO rescuing and caring
for Indian street dogs. Founded by Pooja Prasad. Exported from Hostinger Horizons.

## Structure
- `apps/web` — React + Vite + Tailwind front end (public pages + admin dashboard)
- `apps/api` — Node API (Stripe payments)
- `apps/pocketbase` — PocketBase schema migrations and hooks

## Run locally
```bash
npm install
cp apps/api/.env.example apps/api/.env   # add your Stripe key
npm run dev                              # web on :3000
```

The live PocketBase database (`apps/pocketbase/pb_data`) and `.env` are deliberately
not committed. Migrations in `apps/pocketbase/pb_migrations` recreate the schema.

## Admin
Log in at `/login`. **Change the default admin password before going live.**

Image credits: see [IMAGE_CREDITS.md](IMAGE_CREDITS.md).
