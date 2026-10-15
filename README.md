# Kudrat Humane Living Trust — kudrathumane.org

Website and shelter management system for Kudrat Humane Living Trust, an NGO that rescues and
cares for Indie street dogs. Founder: Pooja Prasad.

Built with React + Vite + Tailwind. Data, logins and photos live in **Supabase**. There is no
server to run: the site is plain static files, so it works on Hostinger shared hosting.

## What's inside

**Public site:** home, meet the dogs (filters), dog profiles with health badges and rescue story,
virtual adoption (pick a dog → amount from ₹5,000/month → account → UPI payment), donate
(UPI QR + "I've paid" form, 80G receipts), foster application, volunteer sign-up, lost & found
(public reports with photo, approved by staff), contact with map, supporter account
(adoptions, payment history, certificates, receipts) and the foster family portal (daily
updates with weight, mood and photos).

**Admin (`/admin`):** overview with alerts (vaccines/deworming due, pending payments, low stock,
follow-ups, new applications), dogs + full medical file per dog (vaccinations with auto due
dates, treatments with medicines and progress notes, deworming, spay/neuter, microchip,
status history, PDF health record and vaccination certificate), rescue operations with map
pin and hotspot map, release checklist and discharge with 7/30-day follow-ups, microchip
search, fostering (applications → placements → updates), volunteers and hours, lost & found
moderation and matching, messages, logins & roles, virtual adoptions, payments & donations
(confirm UTRs, auto receipt numbers, CSV statements), in-kind donations (auto-added to
inventory), inventory with usage log and low-stock flags, payment QR codes, adoption and
anniversary certificates, social media post + image card generator and Dog of the Week,
monthly impact report (PDF/CSV), and site settings.

**Roles:** admin (everything), volunteer (dogs, medical, rescues, releases, lost & found — no
money), foster (foster portal), supporter (own adoptions and payments). Enforced in the
database with row-level security.

## Setup (one time)

1. **Database:** Supabase → SQL Editor → New query → paste `supabase/01_schema.sql` → Run.
   If you ran an older schema before, run `supabase/00_reset.sql` first (it deletes the old tables).
2. **Admin login:** Authentication → Users → Add user (tick *Auto Confirm User*), then run
   `update public.profiles set role = 'admin' where email = 'YOUR EMAIL';`
3. **Email confirmation (optional):** Authentication → Sign In / Providers → Email. Leave
   *Confirm email* on for real sign-ups, or turn it off so supporters can log in straight away.
   Set *Site URL* (Authentication → URL Configuration) to `https://kudrathumane.org`.
4. **Keys:** Project Settings → API Keys → copy the **publishable** key (`sb_publishable_…`).
   Never use the secret key in the website; the build stops if you try.
5. **After first login:** Admin → Site settings (phone, address, UPI ID, 80G number) and
   Admin → Payment QR codes.

## Deploy to Hostinger

**Option A — automatic (recommended).** Every push to `main` builds the site into the `deploy`
branch (the project URL and publishable key are built in; override them with Actions variables
`SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` if they ever change). In Hostinger hPanel → Websites → Git, connect this repo,
branch **deploy**, install path `public_html` (empty the folder first).

**Option B — manual.** `cp .env.example .env`, fill in the key, then:

```bash
npm install
npm run build
```

Upload the contents of `dist/` (including the hidden `.htaccess`) into `public_html`.

## Local development

```bash
npm install
cp .env.example .env   # add your publishable key
npm run dev
```

## Payments

Payments are by UPI: supporters pay with any UPI app and enter the UTR; staff confirm it against
the bank statement in Admin → Payments, which activates the adoption and issues a receipt number.
Card payments (Stripe/Razorpay) need a small server function and aren't included.

Photo credits: see `IMAGE_CREDITS.md`.
