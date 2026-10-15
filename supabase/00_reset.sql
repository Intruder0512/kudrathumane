-- ⚠️  Deletes ALL website tables and their data, including tables from the older schema.
-- Use only to start fresh (e.g. before running 01_schema.sql for the first time
-- if you already ran an older version). Login accounts in Authentication are kept.

drop table if exists
  public.certificates, public.social_posts, public.contact_messages, public.lost_found_reports,
  public.foster_updates, public.foster_placements, public.foster_applications,
  public.volunteer_hours, public.volunteers, public.inventory_movements, public.inventory_items,
  public.in_kind_donations, public.qr_codes, public.payments, public.virtual_adoptions,
  public.releases, public.dewormings, public.treatment_notes, public.treatments, public.vaccinations,
  public.rescues, public.dog_status_history, public.dogs, public.settings, public.profiles,
  -- older schema
  public.qr_code, public.release_checklist, public.deworming, public.in_kind_donations,
  public.inventory, public.inventory_usage, public.microchips, public.foster_families,
  public.adoption_certificates, public.social_media_content, public.adoptions
cascade;

drop function if exists public.is_admin() cascade;
drop function if exists public.is_staff() cascade;
drop function if exists public.my_role() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.protect_role() cascade;
drop function if exists public.touch_updated() cascade;
