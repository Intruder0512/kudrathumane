-- Kudrat Humane Living Trust — Supabase schema
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).

create extension if not exists pgcrypto;

-- ───────── Users / profiles ─────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  phone text,
  address text,
  role text not null default 'user' check (role in ('user','admin')),
  created timestamptz default now(),
  updated timestamptz default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New sign-ups always get role 'user' (role can only be changed by SQL / an admin)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone, address)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'phone',
          new.raw_user_meta_data->>'address')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop users from promoting themselves to admin
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin()
     and coalesce(auth.role(),'') <> 'service_role' and auth.uid() is not null then
    new.role := old.role;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete using (public.is_admin());

-- keep "updated" current
create or replace function public.touch_updated() returns trigger language plpgsql as $$
begin new.updated := now(); return new; end $$;

-- ───────── dogs ─────────
create table if not exists public.dogs (
  id text primary key default gen_random_uuid()::text,
  name text,
  breed text,
  age numeric,
  sex text,
  rescued_from_area text,
  photo text,
  status text default 'Available',
  health_status text default 'rescued',
  spay_neuter_status text,
  spay_neuter_date date,
  operating_vet text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists dogs_touch on public.dogs;
create trigger dogs_touch before update on public.dogs for each row execute function public.touch_updated();
alter table public.dogs enable row level security;
drop policy if exists dogs_select on public.dogs;
create policy dogs_select on public.dogs for select using (true);
drop policy if exists dogs_insert on public.dogs;
create policy dogs_insert on public.dogs for insert with check (public.is_admin());
drop policy if exists dogs_update on public.dogs;
create policy dogs_update on public.dogs for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists dogs_delete on public.dogs;
create policy dogs_delete on public.dogs for delete using (public.is_admin());

-- ───────── virtual_adoptions ─────────
create table if not exists public.virtual_adoptions (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  dog_id text,
  monthly_amount numeric,
  payment_status text default 'pending',
  adoption_date timestamptz default now(),
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists virtual_adoptions_touch on public.virtual_adoptions;
create trigger virtual_adoptions_touch before update on public.virtual_adoptions for each row execute function public.touch_updated();
alter table public.virtual_adoptions enable row level security;
drop policy if exists virtual_adoptions_select on public.virtual_adoptions;
create policy virtual_adoptions_select on public.virtual_adoptions for select using (public.is_admin()  or  user_id = auth.uid()::text);
drop policy if exists virtual_adoptions_insert on public.virtual_adoptions;
create policy virtual_adoptions_insert on public.virtual_adoptions for insert with check (auth.uid() is not null);
drop policy if exists virtual_adoptions_update on public.virtual_adoptions;
create policy virtual_adoptions_update on public.virtual_adoptions for update using (user_id = auth.uid()::text  or  public.is_admin()) with check (user_id = auth.uid()::text  or  public.is_admin());
drop policy if exists virtual_adoptions_delete on public.virtual_adoptions;
create policy virtual_adoptions_delete on public.virtual_adoptions for delete using (user_id = auth.uid()::text  or  public.is_admin());

-- ───────── payments ─────────
create table if not exists public.payments (
  id text primary key default gen_random_uuid()::text,
  adoption_id text,
  amount numeric,
  payment_date timestamptz default now(),
  payment_method text,
  status text default 'pending',
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated();
alter table public.payments enable row level security;
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select using (public.is_admin());
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert with check (auth.uid() is not null);
drop policy if exists payments_update on public.payments;
create policy payments_update on public.payments for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists payments_delete on public.payments;
create policy payments_delete on public.payments for delete using (public.is_admin());

-- ───────── qr_code ─────────
create table if not exists public.qr_code (
  id text primary key default gen_random_uuid()::text,
  image text,
  uploaded_date timestamptz default now(),
  updated_date timestamptz default now(),
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists qr_code_touch on public.qr_code;
create trigger qr_code_touch before update on public.qr_code for each row execute function public.touch_updated();
alter table public.qr_code enable row level security;
drop policy if exists qr_code_select on public.qr_code;
create policy qr_code_select on public.qr_code for select using (true);
drop policy if exists qr_code_insert on public.qr_code;
create policy qr_code_insert on public.qr_code for insert with check (public.is_admin());
drop policy if exists qr_code_update on public.qr_code;
create policy qr_code_update on public.qr_code for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists qr_code_delete on public.qr_code;
create policy qr_code_delete on public.qr_code for delete using (public.is_admin());

-- ───────── rescues ─────────
create table if not exists public.rescues (
  id text primary key default gen_random_uuid()::text,
  dog_id text,
  rescue_date date,
  rescue_location text,
  rescue_type text,
  rescued_by text,
  intake_condition text,
  intake_photos text[] default '{}',
  initial_notes text,
  location_coordinates text,
  dog_name text,
  dog_description text,
  condition_when_found text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists rescues_touch on public.rescues;
create trigger rescues_touch before update on public.rescues for each row execute function public.touch_updated();
alter table public.rescues enable row level security;
drop policy if exists rescues_select on public.rescues;
create policy rescues_select on public.rescues for select using (true);
drop policy if exists rescues_insert on public.rescues;
create policy rescues_insert on public.rescues for insert with check (public.is_admin());
drop policy if exists rescues_update on public.rescues;
create policy rescues_update on public.rescues for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists rescues_delete on public.rescues;
create policy rescues_delete on public.rescues for delete using (public.is_admin());

-- ───────── vaccinations ─────────
create table if not exists public.vaccinations (
  id text primary key default gen_random_uuid()::text,
  dog_id text,
  vaccine_name text,
  date_administered date,
  next_due_date date,
  administered_by text,
  batch_number text,
  status text default 'up to date',
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists vaccinations_touch on public.vaccinations;
create trigger vaccinations_touch before update on public.vaccinations for each row execute function public.touch_updated();
alter table public.vaccinations enable row level security;
drop policy if exists vaccinations_select on public.vaccinations;
create policy vaccinations_select on public.vaccinations for select using (true);
drop policy if exists vaccinations_insert on public.vaccinations;
create policy vaccinations_insert on public.vaccinations for insert with check (public.is_admin());
drop policy if exists vaccinations_update on public.vaccinations;
create policy vaccinations_update on public.vaccinations for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists vaccinations_delete on public.vaccinations;
create policy vaccinations_delete on public.vaccinations for delete using (public.is_admin());

-- ───────── treatments ─────────
create table if not exists public.treatments (
  id text primary key default gen_random_uuid()::text,
  dog_id text,
  condition text,
  start_date date,
  treatment_plan text,
  medications text,
  frequency text,
  vet_name text,
  progress_notes text,
  end_date date,
  outcome text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists treatments_touch on public.treatments;
create trigger treatments_touch before update on public.treatments for each row execute function public.touch_updated();
alter table public.treatments enable row level security;
drop policy if exists treatments_select on public.treatments;
create policy treatments_select on public.treatments for select using (true);
drop policy if exists treatments_insert on public.treatments;
create policy treatments_insert on public.treatments for insert with check (public.is_admin());
drop policy if exists treatments_update on public.treatments;
create policy treatments_update on public.treatments for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists treatments_delete on public.treatments;
create policy treatments_delete on public.treatments for delete using (public.is_admin());

-- ───────── deworming ─────────
create table if not exists public.deworming (
  id text primary key default gen_random_uuid()::text,
  dog_id text,
  deworming_date date,
  next_due_date date,
  medication text,
  administered_by text,
  dosage text,
  notes text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists deworming_touch on public.deworming;
create trigger deworming_touch before update on public.deworming for each row execute function public.touch_updated();
alter table public.deworming enable row level security;
drop policy if exists deworming_select on public.deworming;
create policy deworming_select on public.deworming for select using (true);
drop policy if exists deworming_insert on public.deworming;
create policy deworming_insert on public.deworming for insert with check (public.is_admin());
drop policy if exists deworming_update on public.deworming;
create policy deworming_update on public.deworming for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists deworming_delete on public.deworming;
create policy deworming_delete on public.deworming for delete using (public.is_admin());

-- ───────── release_checklist ─────────
create table if not exists public.release_checklist (
  id text primary key default gen_random_uuid()::text,
  dog_id text,
  vaccinations_complete boolean default false,
  treatment_complete boolean default false,
  spay_neuter_done boolean default false,
  behaviour_assessment boolean default false,
  microchipping boolean default false,
  follow_up_plan text,
  release_type text,
  release_date date,
  released_to text,
  post_release_contact text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists release_checklist_touch on public.release_checklist;
create trigger release_checklist_touch before update on public.release_checklist for each row execute function public.touch_updated();
alter table public.release_checklist enable row level security;
drop policy if exists release_checklist_select on public.release_checklist;
create policy release_checklist_select on public.release_checklist for select using (true);
drop policy if exists release_checklist_insert on public.release_checklist;
create policy release_checklist_insert on public.release_checklist for insert with check (public.is_admin());
drop policy if exists release_checklist_update on public.release_checklist;
create policy release_checklist_update on public.release_checklist for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists release_checklist_delete on public.release_checklist;
create policy release_checklist_delete on public.release_checklist for delete using (public.is_admin());

-- ───────── in_kind_donations ─────────
create table if not exists public.in_kind_donations (
  id text primary key default gen_random_uuid()::text,
  donor_name text,
  donation_date date,
  donation_type text,
  item_description text,
  quantity numeric,
  unit text,
  estimated_value numeric,
  donor_contact text,
  notes text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists in_kind_donations_touch on public.in_kind_donations;
create trigger in_kind_donations_touch before update on public.in_kind_donations for each row execute function public.touch_updated();
alter table public.in_kind_donations enable row level security;
drop policy if exists in_kind_donations_select on public.in_kind_donations;
create policy in_kind_donations_select on public.in_kind_donations for select using (public.is_admin());
drop policy if exists in_kind_donations_insert on public.in_kind_donations;
create policy in_kind_donations_insert on public.in_kind_donations for insert with check (public.is_admin());
drop policy if exists in_kind_donations_update on public.in_kind_donations;
create policy in_kind_donations_update on public.in_kind_donations for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists in_kind_donations_delete on public.in_kind_donations;
create policy in_kind_donations_delete on public.in_kind_donations for delete using (public.is_admin());

-- ───────── volunteers ─────────
create table if not exists public.volunteers (
  id text primary key default gen_random_uuid()::text,
  name text,
  email text,
  phone text,
  location text,
  experience_level text,
  availability text,
  hours_worked numeric,
  tasks_completed numeric,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists volunteers_touch on public.volunteers;
create trigger volunteers_touch before update on public.volunteers for each row execute function public.touch_updated();
alter table public.volunteers enable row level security;
drop policy if exists volunteers_select on public.volunteers;
create policy volunteers_select on public.volunteers for select using (public.is_admin());
drop policy if exists volunteers_insert on public.volunteers;
create policy volunteers_insert on public.volunteers for insert with check (public.is_admin());
drop policy if exists volunteers_update on public.volunteers;
create policy volunteers_update on public.volunteers for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists volunteers_delete on public.volunteers;
create policy volunteers_delete on public.volunteers for delete using (public.is_admin());

-- ───────── inventory ─────────
create table if not exists public.inventory (
  id text primary key default gen_random_uuid()::text,
  name text,
  category text,
  quantity numeric,
  unit text,
  reorder_level numeric,
  last_updated timestamptz default now(),
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists inventory_touch on public.inventory;
create trigger inventory_touch before update on public.inventory for each row execute function public.touch_updated();
alter table public.inventory enable row level security;
drop policy if exists inventory_select on public.inventory;
create policy inventory_select on public.inventory for select using (public.is_admin());
drop policy if exists inventory_insert on public.inventory;
create policy inventory_insert on public.inventory for insert with check (public.is_admin());
drop policy if exists inventory_update on public.inventory;
create policy inventory_update on public.inventory for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists inventory_delete on public.inventory;
create policy inventory_delete on public.inventory for delete using (public.is_admin());

-- ───────── inventory_usage ─────────
create table if not exists public.inventory_usage (
  id text primary key default gen_random_uuid()::text,
  item_id text,
  quantity_used numeric,
  date date,
  used_for text,
  notes text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists inventory_usage_touch on public.inventory_usage;
create trigger inventory_usage_touch before update on public.inventory_usage for each row execute function public.touch_updated();
alter table public.inventory_usage enable row level security;
drop policy if exists inventory_usage_select on public.inventory_usage;
create policy inventory_usage_select on public.inventory_usage for select using (public.is_admin());
drop policy if exists inventory_usage_insert on public.inventory_usage;
create policy inventory_usage_insert on public.inventory_usage for insert with check (public.is_admin());
drop policy if exists inventory_usage_update on public.inventory_usage;
create policy inventory_usage_update on public.inventory_usage for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists inventory_usage_delete on public.inventory_usage;
create policy inventory_usage_delete on public.inventory_usage for delete using (public.is_admin());

-- ───────── microchips ─────────
create table if not exists public.microchips (
  id text primary key default gen_random_uuid()::text,
  dog_id text,
  microchip_number text,
  brand text,
  implant_date date,
  implant_vet text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists microchips_touch on public.microchips;
create trigger microchips_touch before update on public.microchips for each row execute function public.touch_updated();
alter table public.microchips enable row level security;
drop policy if exists microchips_select on public.microchips;
create policy microchips_select on public.microchips for select using (public.is_admin());
drop policy if exists microchips_insert on public.microchips;
create policy microchips_insert on public.microchips for insert with check (public.is_admin());
drop policy if exists microchips_update on public.microchips;
create policy microchips_update on public.microchips for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists microchips_delete on public.microchips;
create policy microchips_delete on public.microchips for delete using (public.is_admin());

-- ───────── foster_families ─────────
create table if not exists public.foster_families (
  id text primary key default gen_random_uuid()::text,
  name text,
  contact_person text,
  email text,
  phone text,
  address text,
  experience_level text,
  max_dogs numeric,
  current_dogs numeric,
  availability text,
  notes text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists foster_families_touch on public.foster_families;
create trigger foster_families_touch before update on public.foster_families for each row execute function public.touch_updated();
alter table public.foster_families enable row level security;
drop policy if exists foster_families_select on public.foster_families;
create policy foster_families_select on public.foster_families for select using (public.is_admin());
drop policy if exists foster_families_insert on public.foster_families;
create policy foster_families_insert on public.foster_families for insert with check (public.is_admin());
drop policy if exists foster_families_update on public.foster_families;
create policy foster_families_update on public.foster_families for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists foster_families_delete on public.foster_families;
create policy foster_families_delete on public.foster_families for delete using (public.is_admin());

-- ───────── foster_placements ─────────
create table if not exists public.foster_placements (
  id text primary key default gen_random_uuid()::text,
  foster_id text,
  dog_id text,
  assignment_date date,
  expected_return_date date,
  actual_return_date date,
  special_care_instructions text,
  status text default 'Active',
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists foster_placements_touch on public.foster_placements;
create trigger foster_placements_touch before update on public.foster_placements for each row execute function public.touch_updated();
alter table public.foster_placements enable row level security;
drop policy if exists foster_placements_select on public.foster_placements;
create policy foster_placements_select on public.foster_placements for select using (public.is_admin());
drop policy if exists foster_placements_insert on public.foster_placements;
create policy foster_placements_insert on public.foster_placements for insert with check (public.is_admin());
drop policy if exists foster_placements_update on public.foster_placements;
create policy foster_placements_update on public.foster_placements for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists foster_placements_delete on public.foster_placements;
create policy foster_placements_delete on public.foster_placements for delete using (public.is_admin());

-- ───────── foster_updates ─────────
create table if not exists public.foster_updates (
  id text primary key default gen_random_uuid()::text,
  placement_id text,
  date date,
  weight numeric,
  health_notes text,
  behavior_notes text,
  photos text[] default '{}',
  mood_level text,
  created_by text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists foster_updates_touch on public.foster_updates;
create trigger foster_updates_touch before update on public.foster_updates for each row execute function public.touch_updated();
alter table public.foster_updates enable row level security;
drop policy if exists foster_updates_select on public.foster_updates;
create policy foster_updates_select on public.foster_updates for select using (public.is_admin());
drop policy if exists foster_updates_insert on public.foster_updates;
create policy foster_updates_insert on public.foster_updates for insert with check (auth.uid() is not null);
drop policy if exists foster_updates_update on public.foster_updates;
create policy foster_updates_update on public.foster_updates for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists foster_updates_delete on public.foster_updates;
create policy foster_updates_delete on public.foster_updates for delete using (public.is_admin());

-- ───────── lost_found_reports ─────────
create table if not exists public.lost_found_reports (
  id text primary key default gen_random_uuid()::text,
  type text,
  dog_description text,
  location text,
  date_reported date,
  photos text[] default '{}',
  reporter_name text,
  reporter_contact text,
  reward_offered numeric,
  status text default 'Lost',
  matched_with_id text,
  notes text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists lost_found_reports_touch on public.lost_found_reports;
create trigger lost_found_reports_touch before update on public.lost_found_reports for each row execute function public.touch_updated();
alter table public.lost_found_reports enable row level security;
drop policy if exists lost_found_reports_select on public.lost_found_reports;
create policy lost_found_reports_select on public.lost_found_reports for select using (true);
drop policy if exists lost_found_reports_insert on public.lost_found_reports;
create policy lost_found_reports_insert on public.lost_found_reports for insert with check (true);
drop policy if exists lost_found_reports_update on public.lost_found_reports;
create policy lost_found_reports_update on public.lost_found_reports for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists lost_found_reports_delete on public.lost_found_reports;
create policy lost_found_reports_delete on public.lost_found_reports for delete using (public.is_admin());

-- ───────── adoption_certificates ─────────
create table if not exists public.adoption_certificates (
  id text primary key default gen_random_uuid()::text,
  adopter_name text,
  dog_id text,
  adoption_date date,
  certificate_date date,
  certificate_pdf_url text,
  custom_message text,
  status text default 'Generated',
  sent_date date,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists adoption_certificates_touch on public.adoption_certificates;
create trigger adoption_certificates_touch before update on public.adoption_certificates for each row execute function public.touch_updated();
alter table public.adoption_certificates enable row level security;
drop policy if exists adoption_certificates_select on public.adoption_certificates;
create policy adoption_certificates_select on public.adoption_certificates for select using (public.is_admin());
drop policy if exists adoption_certificates_insert on public.adoption_certificates;
create policy adoption_certificates_insert on public.adoption_certificates for insert with check (public.is_admin());
drop policy if exists adoption_certificates_update on public.adoption_certificates;
create policy adoption_certificates_update on public.adoption_certificates for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists adoption_certificates_delete on public.adoption_certificates;
create policy adoption_certificates_delete on public.adoption_certificates for delete using (public.is_admin());

-- ───────── social_media_content ─────────
create table if not exists public.social_media_content (
  id text primary key default gen_random_uuid()::text,
  dog_id text,
  story_type text,
  tone text,
  story_text text,
  instagram_caption text,
  facebook_post text,
  twitter_post text,
  image_url text,
  status text default 'Draft',
  platform text default 'All',
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists social_media_content_touch on public.social_media_content;
create trigger social_media_content_touch before update on public.social_media_content for each row execute function public.touch_updated();
alter table public.social_media_content enable row level security;
drop policy if exists social_media_content_select on public.social_media_content;
create policy social_media_content_select on public.social_media_content for select using (public.is_admin());
drop policy if exists social_media_content_insert on public.social_media_content;
create policy social_media_content_insert on public.social_media_content for insert with check (public.is_admin());
drop policy if exists social_media_content_update on public.social_media_content;
create policy social_media_content_update on public.social_media_content for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists social_media_content_delete on public.social_media_content;
create policy social_media_content_delete on public.social_media_content for delete using (public.is_admin());

-- ───────── adoptions ─────────
create table if not exists public.adoptions (
  id text primary key default gen_random_uuid()::text,
  dog_id text,
  adopter_name text,
  adopter_email text,
  adopter_phone text,
  adopter_address text,
  adoption_date date,
  adoption_type text,
  adoption_fee numeric,
  follow_up_date date,
  notes text,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists adoptions_touch on public.adoptions;
create trigger adoptions_touch before update on public.adoptions for each row execute function public.touch_updated();
alter table public.adoptions enable row level security;
drop policy if exists adoptions_select on public.adoptions;
create policy adoptions_select on public.adoptions for select using (public.is_admin());
drop policy if exists adoptions_insert on public.adoptions;
create policy adoptions_insert on public.adoptions for insert with check (public.is_admin());
drop policy if exists adoptions_update on public.adoptions;
create policy adoptions_update on public.adoptions for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists adoptions_delete on public.adoptions;
create policy adoptions_delete on public.adoptions for delete using (public.is_admin());

-- ───────── certificates ─────────
create table if not exists public.certificates (
  id text primary key default gen_random_uuid()::text,
  adopter_name text,
  dog_id text,
  adoption_date date,
  custom_message text,
  pdf_data text,
  created_at timestamptz default now(),
  sent_to_email text,
  sent_at timestamptz,
  created timestamptz default now(),
  updated timestamptz default now()
);
drop trigger if exists certificates_touch on public.certificates;
create trigger certificates_touch before update on public.certificates for each row execute function public.touch_updated();
alter table public.certificates enable row level security;
drop policy if exists certificates_select on public.certificates;
create policy certificates_select on public.certificates for select using (public.is_admin());
drop policy if exists certificates_insert on public.certificates;
create policy certificates_insert on public.certificates for insert with check (public.is_admin());
drop policy if exists certificates_update on public.certificates;
create policy certificates_update on public.certificates for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists certificates_delete on public.certificates;
create policy certificates_delete on public.certificates for delete using (public.is_admin());

-- ───────── Storage (dog photos, QR codes, report photos) ─────────
insert into storage.buckets (id, name, public) values ('uploads','uploads', true)
  on conflict (id) do update set public = true;

drop policy if exists uploads_read on storage.objects;
create policy uploads_read on storage.objects for select using (bucket_id = 'uploads');

drop policy if exists uploads_admin_write on storage.objects;
create policy uploads_admin_write on storage.objects for all
  using (bucket_id = 'uploads' and public.is_admin())
  with check (bucket_id = 'uploads' and public.is_admin());

-- Members of the public can attach photos to lost & found reports
drop policy if exists uploads_public_lostfound on storage.objects;
create policy uploads_public_lostfound on storage.objects for insert
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = 'lost_found_reports');

-- Logged-in foster families can attach photos to their updates
drop policy if exists uploads_foster_updates on storage.objects;
create policy uploads_foster_updates on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = 'foster_updates');

-- ───────── Sample dogs (only if the table is empty) ─────────
insert into public.dogs (name, breed, age, sex, rescued_from_area, status)
select * from (values
  ('Simba','Indie/Mixed',3,'Male','Mumbai streets','Available'),
  ('Golu','Indie/Mixed',2,'Male','Delhi','Available'),
  ('Moti','Indie/Mixed',4,'Female','Bangalore','Available'),
  ('Bholu','Indie/Mixed',1.5,'Male','Pune','Available'),
  ('Shera','Indie/Mixed',5,'Male','Kolkata','Available'),
  ('Kalu','Indie/Mixed',2.5,'Female','Hyderabad','Available')
) v(name, breed, age, sex, rescued_from_area, status)
where not exists (select 1 from public.dogs);

-- ───────── Make yourself admin ─────────
-- 1) Authentication → Users → Add user (email + strong password, tick "Auto confirm")
-- 2) Then run (with your email):
-- update public.profiles set role = 'admin' where email = 'admin@kudrathumane.org';
