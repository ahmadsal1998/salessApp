-- ============================================================
-- Baraka Sales App — Data API permission grants
--
-- Context: Starting May 30 Supabase will no longer grant public-
-- schema table access to the `anon` / `authenticated` PostgREST
-- roles by default.  Explicit GRANTs are now required so that the
-- Data API (PostgREST) can forward queries to these tables.
--
-- RLS policies remain the real security boundary — these GRANTs
-- only give PostgREST permission to reach the tables; the policies
-- then decide what each authenticated user can actually read/write.
--
-- HOW TO APPLY:
--   Supabase Dashboard → SQL Editor → paste & run this file.
-- ============================================================

-- Allow both roles to resolve names inside the public schema.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ── profiles ────────────────────────────────────────────────
-- INSERT is intentionally omitted: profile rows are created by
-- the handle_new_user() SECURITY DEFINER trigger, never directly
-- by the client.  DELETE is also omitted: profile cleanup happens
-- via CASCADE when the auth.users row is removed.
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- ── customers ───────────────────────────────────────────────
-- Full CRUD needed: admins create/update/delete, sales reps
-- read and update their assigned customers.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

-- ── visits ──────────────────────────────────────────────────
-- Sales reps insert new visit records; admins and sales reps
-- both read.  UPDATE/DELETE are included for completeness and
-- forward-compatibility (RLS still enforces actual access).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;

-- ── rejection_reasons ───────────────────────────────────────
-- All authenticated users can read; only admins can write
-- (enforced by the rejection_reasons_admin_write RLS policy).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rejection_reasons TO authenticated;

-- ── get_user_role() helper ──────────────────────────────────
-- PostgREST evaluates RLS policies as the calling role, so the
-- `authenticated` role must be able to EXECUTE the helper that
-- the policies call.  (PostgreSQL grants EXECUTE to PUBLIC by
-- default for functions, but being explicit is safer post-change.)
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
