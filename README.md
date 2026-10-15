# Kudrat Humane Living Trust — kudrathumane.org

Website and admin system for Kudrat Humane Living Trust, an NGO rescuing and caring
for Indian street dogs. Founded by Pooja Prasad. Originally built on Hostinger Horizons,
now running on **Supabase** (database, logins, photo storage).

## Structure
- `apps/web` — React + Vite + Tailwind website (public pages + admin dashboard). Static files after build.
- `apps/api` — small Node server for Stripe payments, certificates and emails.
- `supabase/schema.sql` — all tables, security rules, photo storage and sample dogs.

## One-time Supabase setup
1. **Run the schema:** Supabase Dashboard → SQL Editor → New query → paste `supabase/schema.sql` → Run.
2. **Create the admin login:** Authentication → Users → Add user → email + a strong password,
   tick *Auto Confirm User*. Then in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'admin@kudrathumane.org';
   ```
3. **Get your keys:** Project Settings → API Keys.
   - *Publishable* key (`sb_publishable_…`) → website (`apps/web/.env`). Safe in the browser.
   - *Secret* key (`sb_secret_…`) → API server only (`apps/api/.env`). Never commit it or put it in the website.
4. (Optional) Authentication → Sign In / Providers → Email: turn off *Confirm email* if supporters
   should be able to log in straight after signing up.

## Run locally
```bash
npm install
cp apps/web/.env.example apps/web/.env   # add publishable key
cp apps/api/.env.example apps/api/.env   # add secret key + Stripe key
npm run dev                              # website on :3000, API on :3001
```

## Deploy
- **Website:** `npm run build --prefix apps/web`, then upload the *contents* of `dist/apps/web/`
  (including `.htaccess`) into Hostinger `public_html`. Set the `VITE_…` values in `apps/web/.env` before building.
- **API:** needs a Node host (e.g. Render, Railway, a Hostinger VPS). Set the variables from
  `apps/api/.env.example` there, and set `VITE_API_URL` in the website to its address.
  Without it, the site still works; only Stripe checkout, certificates and emails need the API.

Image credits: see [IMAGE_CREDITS.md](IMAGE_CREDITS.md).
