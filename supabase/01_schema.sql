-- ═══════════════════════════════════════════════════════════════════════════
-- Kudrat Humane Living Trust — database schema (Supabase / Postgres)
-- Run in Supabase: SQL Editor → New query → paste this file → Run.
-- Safe to re-run. If you ran an older schema before, run 00_reset.sql first.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ───────────────────────── People & roles ─────────────────────────
-- role: admin (full access), volunteer (dogs + medical + rescues),
--       foster (their placements), supporter (their adoptions & payments)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  address text,
  role text not null default 'supporter' check (role in ('admin','volunteer','foster','supporter')),
  created_at timestamptz not null default now()
);

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false);
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin','volunteer'), false);
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, address)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          new.raw_user_meta_data->>'phone',
          new.raw_user_meta_data->>'address')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for accounts that existed before this script ran
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

-- Only admins (or SQL) can change roles
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- ───────────────────────── Site settings (single row) ─────────────────────────
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  trust_name text default 'Kudrat Humane Living Trust',
  founder_name text default 'Pooja Prasad',
  phone text default '',
  email text default 'info@kudrathumane.org',
  address text default '',
  map_query text default 'Kudrat Humane Living Trust',
  map_link text default 'https://maps.app.goo.gl/fLbPNCMJF8TjPL389',
  upi_id text default '',
  upi_payee_name text default 'Kudrat Humane Living Trust',
  registration_number text default '',
  eighty_g_number text default '',
  pan text default '',
  instagram_url text default '',
  facebook_url text default '',
  min_monthly_amount numeric default 5000,
  featured_dog_id uuid,
  rescued_offset int default 0,
  updated_at timestamptz default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ───────────────────────── Dogs ─────────────────────────
-- status follows the health lifecycle:
-- rescued → under_assessment → under_treatment → recovering → ready → adopted / fostered / released
create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text default 'Indie',
  age_years numeric,
  sex text check (sex in ('male','female')),
  colour text,
  rescued_from_area text,
  story text,
  personality text,
  photo_url text,
  gallery text[] not null default '{}',
  status text not null default 'rescued' check (status in
    ('rescued','under_assessment','under_treatment','recovering','ready','adopted','fostered','released','deceased')),
  open_for_virtual_adoption boolean not null default true,
  spay_neuter text not null default 'not_yet' check (spay_neuter in ('done','not_yet','scheduled','waived')),
  spay_neuter_date date,
  spay_neuter_vet text,
  microchip_number text,
  microchip_brand text,
  microchip_date date,
  intake_date date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dogs_status_idx on public.dogs(status);
create unique index if not exists dogs_microchip_idx on public.dogs(microchip_number) where microchip_number is not null and microchip_number <> '';

create table if not exists public.dog_status_history (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);

create or replace function public.log_dog_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    insert into public.dog_status_history (dog_id, from_status, to_status) values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.dog_status_history (dog_id, from_status, to_status) values (new.id, old.status, new.status);
  end if;
  return new;
end $$;
drop trigger if exists dogs_status_log on public.dogs;
create trigger dogs_status_log after insert on public.dogs for each row execute function public.log_dog_status();
drop trigger if exists dogs_status_log_upd on public.dogs;
create trigger dogs_status_log_upd before update on public.dogs for each row execute function public.log_dog_status();

-- ───────────────────────── Rescue operations ─────────────────────────
create table if not exists public.rescues (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references public.dogs(id) on delete set null,
  rescue_date date not null default current_date,
  location_text text,
  area text,
  city text,
  state text,
  latitude double precision,
  longitude double precision,
  rescue_type text check (rescue_type in ('road_accident','abuse_case','abandoned','stray_illness','other')),
  rescued_by text,
  intake_condition text check (intake_condition in ('critical','serious','stable','healthy')),
  photos text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists rescues_date_idx on public.rescues(rescue_date);

-- ───────────────────────── Medical ─────────────────────────
create table if not exists public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  vaccine text not null,
  date_administered date not null,
  next_due_date date,
  administered_by text,
  batch_number text,
  created_at timestamptz not null default now()
);
create index if not exists vaccinations_due_idx on public.vaccinations(next_due_date);

create table if not exists public.treatments (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  condition text not null,
  start_date date not null default current_date,
  plan text,
  medications jsonb not null default '[]',   -- [{ "name": "...", "dosage": "..." }]
  frequency text check (frequency in ('daily','twice_daily','weekly','as_needed')),
  vet text,
  end_date date,
  outcome text not null default 'ongoing' check (outcome in ('ongoing','recovered','referred','deceased')),
  created_at timestamptz not null default now()
);

create table if not exists public.treatment_notes (
  id uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references public.treatments(id) on delete cascade,
  note text not null,
  author uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.dewormings (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  kind text not null default 'deworming' check (kind in ('deworming','tick_flea')),
  date_given date not null default current_date,
  next_due_date date,
  medication text,
  dosage text,
  administered_by text,
  notes text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Release / discharge ─────────────────────────
create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  vaccinations_complete boolean not null default false,
  treatment_complete boolean not null default false,
  spay_neuter_done boolean not null default false,
  spay_neuter_waiver_reason text,
  behaviour_passed boolean not null default false,
  microchipped boolean not null default false,
  follow_up_plan text,
  release_type text check (release_type in ('virtual_adoption','physical_foster','permanent_adoption','return_to_street','transfer')),
  release_date date,
  released_to text,
  contact text,
  photos text[] not null default '{}',
  follow_up_7_done boolean not null default false,
  follow_up_30_done boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Virtual adoptions & money ─────────────────────────
create table if not exists public.virtual_adoptions (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  supporter_name text not null,
  supporter_email text,
  supporter_phone text,
  monthly_amount numeric not null check (monthly_amount > 0),
  start_date date not null default current_date,
  status text not null default 'pending' check (status in ('pending','active','completed','cancelled')),
  cancel_reason text,
  created_at timestamptz not null default now()
);

-- One table for every rupee received: monthly adoption payments and one-time donations.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  purpose text not null default 'donation' check (purpose in ('virtual_adoption','donation')),
  virtual_adoption_id uuid references public.virtual_adoptions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  donor_name text not null,
  donor_email text,
  donor_phone text,
  donor_pan text,
  amount numeric not null check (amount > 0),
  method text not null default 'upi' check (method in ('upi','bank_transfer','cash','cheque','card','other')),
  reference text,
  for_month date,
  paid_on date not null default current_date,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  notes text,
  receipt_number text,
  created_at timestamptz not null default now()
);
create index if not exists payments_paid_on_idx on public.payments(paid_on);

-- Visitors can only submit a payment as pending; staff confirm it.
create or replace function public.guard_payment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then new.status := 'pending'; new.receipt_number := null; end if;
    if tg_op = 'UPDATE' then new.status := old.status; new.receipt_number := old.receipt_number; end if;
  end if;
  return new;
end $$;
drop trigger if exists payments_guard on public.payments;
create trigger payments_guard before insert or update on public.payments for each row execute function public.guard_payment();

create or replace function public.guard_adoption() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and coalesce(auth.role(),'') <> 'service_role' then
    if tg_op = 'INSERT' then new.status := 'pending'; new.user_id := auth.uid(); end if;
    if tg_op = 'UPDATE' and new.status <> old.status and new.status <> 'cancelled' then new.status := old.status; end if;
  end if;
  return new;
end $$;
drop trigger if exists adoptions_guard on public.virtual_adoptions;
create trigger adoptions_guard before insert or update on public.virtual_adoptions for each row execute function public.guard_adoption();

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  label text not null,              -- UPI, Google Pay, PhonePe, Paytm…
  upi_id text,
  image_url text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.in_kind_donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  donor_contact text,
  donation_date date not null default current_date,
  category text not null default 'food' check (category in ('food','medicine','medical_supplies','bedding','toys','grooming','equipment','other')),
  description text,
  quantity numeric,
  unit text,
  estimated_value numeric not null default 0,
  inventory_item_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Inventory ─────────────────────────
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'food' check (category in ('food','medicine','medical_supplies','bedding','toys','grooming','equipment','other')),
  quantity numeric not null default 0,
  unit text default 'pieces',
  reorder_level numeric not null default 0,
  notes text,
  updated_at timestamptz not null default now()
);
create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  change numeric not null,           -- + received, − used
  reason text not null default 'used' check (reason in ('received','used','donated_in','expired','correction')),
  dog_id uuid references public.dogs(id) on delete set null,
  moved_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);
create or replace function public.apply_inventory_movement() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.inventory_items set quantity = quantity + new.change, updated_at = now() where id = new.item_id;
  return new;
end $$;
drop trigger if exists inventory_movement_apply on public.inventory_movements;
create trigger inventory_movement_apply after insert on public.inventory_movements for each row execute function public.apply_inventory_movement();

-- ───────────────────────── Volunteers ─────────────────────────
create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  location text,
  skills text,
  availability text,
  message text,
  status text not null default 'new' check (status in ('new','active','inactive')),
  created_at timestamptz not null default now()
);
create table if not exists public.volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  worked_on date not null default current_date,
  hours numeric not null check (hours > 0),
  task text,
  rescue_id uuid references public.rescues(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Fostering ─────────────────────────
create table if not exists public.foster_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  email text not null,
  phone text not null,
  address text,
  city text,
  home_type text,
  has_other_pets boolean default false,
  experience text,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists public.foster_placements (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  foster_user_id uuid references auth.users(id) on delete set null,
  foster_name text not null,
  foster_email text,
  foster_phone text,
  start_date date not null default current_date,
  expected_end_date date,
  end_date date,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  care_instructions text,
  created_at timestamptz not null default now()
);
create table if not exists public.foster_updates (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.foster_placements(id) on delete cascade,
  author uuid default auth.uid(),
  update_date date not null default current_date,
  weight_kg numeric,
  mood text check (mood in ('playful','calm','energetic','tired','unwell')),
  eating text,
  health_notes text,
  behaviour_notes text,
  photos text[] not null default '{}',
  admin_comment text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Lost & found ─────────────────────────
create table if not exists public.lost_found_reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('lost','found')),
  dog_description text not null,
  colour text,
  area text not null,
  city text,
  seen_on date not null default current_date,
  photo_url text,
  reporter_name text not null,
  reporter_phone text not null,
  reporter_email text,
  reward numeric,
  status text not null default 'open' check (status in ('open','matched','reunited','in_shelter','closed')),
  approved boolean not null default false,
  matched_report_id uuid references public.lost_found_reports(id) on delete set null,
  created_at timestamptz not null default now()
);
create or replace function public.guard_lost_found() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() and coalesce(auth.role(),'') <> 'service_role' then
    new.approved := false; new.status := 'open'; new.matched_report_id := null;
  end if;
  return new;
end $$;
drop trigger if exists lost_found_guard on public.lost_found_reports;
create trigger lost_found_guard before insert on public.lost_found_reports for each row execute function public.guard_lost_found();

-- ───────────────────────── Communication & content ─────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references public.dogs(id) on delete set null,
  story_type text,
  tone text,
  headline text,
  body text,
  instagram text,
  facebook text,
  twitter text,
  created_at timestamptz not null default now()
);
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('adoption','anniversary','receipt_80g','vaccination')),
  number text not null unique,
  dog_id uuid references public.dogs(id) on delete set null,
  virtual_adoption_id uuid references public.virtual_adoptions(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  recipient_name text,
  recipient_email text,
  amount numeric,
  issued_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════ Row-level security ═══════════════════════════
do $$
declare t text;
begin
  foreach t in array array['profiles','settings','dogs','dog_status_history','rescues','vaccinations','treatments',
    'treatment_notes','dewormings','releases','virtual_adoptions','payments','qr_codes','in_kind_donations',
    'inventory_items','inventory_movements','volunteers','volunteer_hours','foster_applications','foster_placements',
    'foster_updates','lost_found_reports','contact_messages','social_posts','certificates']
  loop
    execute format('alter table public.%I enable row level security', t);
    -- drop every existing policy on the table so re-runs stay clean
    perform 1;
  end loop;
end $$;

do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Admin can do everything everywhere
do $$
declare t text;
begin
  foreach t in array array['profiles','settings','dogs','dog_status_history','rescues','vaccinations','treatments',
    'treatment_notes','dewormings','releases','virtual_adoptions','payments','qr_codes','in_kind_donations',
    'inventory_items','inventory_movements','volunteers','volunteer_hours','foster_applications','foster_placements',
    'foster_updates','lost_found_reports','contact_messages','social_posts','certificates']
  loop
    execute format('create policy admin_all on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Volunteers (staff) manage dogs, medical records and rescues
do $$
declare t text;
begin
  foreach t in array array['dogs','rescues','vaccinations','treatments','treatment_notes','dewormings','releases','dog_status_history','lost_found_reports']
  loop
    execute format('create policy staff_all on public.%I for all using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- Public read
create policy public_read on public.settings for select using (true);
create policy public_read on public.dogs for select using (true);
create policy public_read on public.vaccinations for select using (true);
create policy public_read on public.rescues for select using (true);
create policy public_read on public.qr_codes for select using (active);
create policy public_read on public.lost_found_reports for select using (approved);

-- Public submit
create policy public_insert on public.lost_found_reports for insert with check (true);
create policy public_insert on public.contact_messages for insert with check (true);
create policy public_insert on public.volunteers for insert with check (status = 'new');
create policy public_insert on public.foster_applications for insert with check (status = 'pending');
create policy public_insert on public.payments for insert
  with check (status = 'pending' and (user_id is null or user_id = auth.uid()));

-- Profiles: see and edit yourself
create policy own_profile_read on public.profiles for select using (id = auth.uid());
create policy own_profile_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Supporters: their own adoptions, payments and certificates
create policy own_read on public.virtual_adoptions for select using (user_id = auth.uid());
create policy own_insert on public.virtual_adoptions for insert to authenticated with check (user_id = auth.uid());
create policy own_cancel on public.virtual_adoptions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy own_read on public.payments for select using (user_id = auth.uid());
create policy own_read on public.certificates for select
  using (virtual_adoption_id in (select id from public.virtual_adoptions where user_id = auth.uid())
      or payment_id in (select id from public.payments where user_id = auth.uid()));
create policy own_read on public.foster_applications for select using (user_id = auth.uid());

-- Foster families: their placements and the updates they post
create policy own_read on public.foster_placements for select using (foster_user_id = auth.uid());
create policy own_read on public.foster_updates for select
  using (placement_id in (select id from public.foster_placements where foster_user_id = auth.uid()));
create policy own_insert on public.foster_updates for insert to authenticated
  with check (placement_id in (select id from public.foster_placements where foster_user_id = auth.uid() and status = 'active'));
create policy staff_read on public.foster_placements for select using (public.is_staff());
create policy staff_read on public.foster_updates for select using (public.is_staff());

-- Public impact numbers without exposing supporter details
create or replace function public.impact_stats() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'dogs_rescued', (select count(*) from public.dogs) + coalesce((select rescued_offset from public.settings where id = 1), 0),
    'in_care', (select count(*) from public.dogs where status not in ('adopted','released','deceased')),
    'virtual_adoptions', (select count(*) from public.virtual_adoptions where status = 'active'),
    'fostered', (select count(*) from public.foster_placements),
    'vaccinations', (select count(*) from public.vaccinations)
  );
$$;
grant execute on function public.impact_stats() to anon, authenticated;

-- Which dogs already have an active virtual adopter (names hidden)
create or replace function public.adopter_counts() returns table (dog_id uuid, adopters bigint)
language sql stable security definer set search_path = public as $$
  select dog_id, count(*) from public.virtual_adoptions where status = 'active' group by dog_id;
$$;
grant execute on function public.adopter_counts() to anon, authenticated;

-- ═══════════════════════════ Photo storage ═══════════════════════════
insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do update set public = true;

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select using (bucket_id = 'media');
drop policy if exists media_staff_write on storage.objects;
create policy media_staff_write on storage.objects for all
  using (bucket_id = 'media' and public.is_staff())
  with check (bucket_id = 'media' and public.is_staff());
drop policy if exists media_public_lost_found on storage.objects;
create policy media_public_lost_found on storage.objects for insert
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'lost-found');
drop policy if exists media_foster_updates on storage.objects;
create policy media_foster_updates on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'foster-updates');

-- ═══════════════════════════ Sample dogs (only if empty) ═══════════════════════════
insert into public.dogs (name, breed, age_years, sex, colour, rescued_from_area, status, story, personality, spay_neuter)
select * from (values
  ('Simba', 'Indie', 3,   'male',   'Golden brown', 'Sector 14, Gurugram', 'ready',
   'Found limping near a tea stall after a scooter clipped his hind leg. Six weeks of rest and he runs again.',
   'Gentle, loves ear scratches, waits politely for food.', 'done'),
  ('Golu',  'Indie', 2,   'male',   'Fawn and white', 'Civil Lines, Delhi', 'recovering',
   'Rescued with severe mange from a construction site. His coat is growing back in patches.',
   'Curious, a little shy with new people, adores other dogs.', 'scheduled'),
  ('Moti',  'Indie', 4,   'female', 'Cream', 'Noida Sector 62', 'ready',
   'Abandoned outside a housing society with her pups. All four pups found homes; Moti is still waiting.',
   'Calm, motherly, good with children.', 'done'),
  ('Bholu', 'Indie', 1.5, 'male',   'Black with tan', 'Ghaziabad', 'under_treatment',
   'Brought in by a school guard after being hit by a car. Recovering from a fractured front leg.',
   'Playful puppy energy even with a cast.', 'not_yet'),
  ('Shera', 'Indie', 5,   'female', 'Brown brindle', 'Faridabad', 'ready',
   'Community dog of a vegetable market who was beaten for "barking too much". Now the calmest dog at the shelter.',
   'Protective, loyal, takes time to trust and then never forgets.', 'done'),
  ('Kalu',  'Indie', 3,   'male',   'Black', 'Greater Noida', 'under_assessment',
   'Found tied to a pole during the monsoon. Our vet is checking him for tick fever.',
   'Quiet, watches everything, wags at the sound of his name.', 'not_yet')
) v(name, breed, age_years, sex, colour, rescued_from_area, status, story, personality, spay_neuter)
where not exists (select 1 from public.dogs);

-- ═══════════════════════════ Make yourself admin ═══════════════════════════
-- 1) Authentication → Users → Add user (email + strong password, tick "Auto Confirm User")
-- 2) Run, with that email:
--    update public.profiles set role = 'admin' where email = 'admin@kudrathumane.org';
