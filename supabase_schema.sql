-- ============================================================
-- Baraka Sales App — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales')),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Rejection Reasons (created before customers/visits due to FK)
CREATE TABLE public.rejection_reasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reason_en TEXT NOT NULL,
  reason_ar TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Customers
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  area TEXT,
  address TEXT,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','visited','interested','approved','rejected','follow_up')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  cover_images JSONB DEFAULT '[]'::jsonb,
  working_hours JSONB DEFAULT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Visits
CREATE TABLE public.visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  result TEXT NOT NULL
    CHECK (result IN ('approved','interested','follow_up','rejected')),
  rejection_reason_id UUID REFERENCES public.rejection_reasons(id) ON DELETE SET NULL,
  notes TEXT,
  next_follow_up TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_customers_assigned_to ON public.customers(assigned_to);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_created_at ON public.customers(created_at);
CREATE INDEX idx_visits_customer_id ON public.visits(customer_id);
CREATE INDEX idx_visits_employee_id ON public.visits(employee_id);
CREATE INDEX idx_visits_visit_date ON public.visits(visit_date);
CREATE INDEX idx_visits_result ON public.visits(result);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejection_reasons ENABLE ROW LEVEL SECURITY;

-- Helper function to check role (avoids recursive RLS issues)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "profiles_sales_own_select" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_sales_own_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Customers policies
CREATE POLICY "customers_admin_all" ON public.customers
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "customers_sales_select" ON public.customers
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "customers_sales_update" ON public.customers
  FOR UPDATE USING (assigned_to = auth.uid());

-- Visits policies
CREATE POLICY "visits_admin_all" ON public.visits
  FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "visits_sales_all" ON public.visits
  FOR ALL USING (employee_id = auth.uid());

-- Rejection reasons policies
CREATE POLICY "rejection_reasons_read_all" ON public.rejection_reasons
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "rejection_reasons_admin_write" ON public.rejection_reasons
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================
-- Trigger: auto-create profile on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Data API (PostgREST) permission grants
-- Required: Supabase no longer grants public-schema access to the
-- anon / authenticated roles by default (effective May 30).
-- RLS policies remain the real security boundary; these grants
-- only let PostgREST reach the tables.
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- profiles: client never inserts/deletes directly (trigger + cascade handle those)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- customers: full CRUD for admin; read/update for assigned sales reps (via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

-- visits: sales reps insert; everyone reads; RLS restricts per-user access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;

-- rejection_reasons: all authenticated users read; only admins write (via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rejection_reasons TO authenticated;

-- helper function called by RLS policies must be executable by the role
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- ============================================================
-- Seed: Default rejection reasons
-- ============================================================
INSERT INTO public.rejection_reasons (reason_en, reason_ar) VALUES
  ('Not interested', 'غير مهتم'),
  ('Price too high', 'السعر مرتفع'),
  ('Already using another system', 'يستخدم نظاماً آخر'),
  ('Not the decision maker', 'ليس صاحب القرار'),
  ('Bad timing', 'التوقيت غير مناسب'),
  ('Doesn''t trust the idea', 'لا يثق بالفكرة'),
  ('Other', 'أخرى');

-- ============================================================
-- Migration: Add cover_images column (run if table already exists)
-- ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cover_images JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT NULL;
-- ============================================================

-- ============================================================
-- IMPORTANT: Creating your first Admin user
-- ============================================================
-- 1. Go to Authentication → Users → Add User
-- 2. Enter your admin email/password
-- 3. After creation, run this (replace with actual UUID from auth.users):
--
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
--
-- ============================================================
-- Supabase Admin API for creating sales employees (via app)
-- ============================================================
-- The app uses supabase.auth.admin.createUser() to create sales employees.
-- This requires the SERVICE_ROLE key on the backend.
-- For a frontend-only app, you can create employees manually from the dashboard
-- and set role = 'sales' in the profiles table.
-- ============================================================
