-- ═══════════════════════════════════════════════════════════════
-- ABD1LLH.ONLINE — Supabase Schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard
-- ═══════════════════════════════════════════════════════════════

-- ─── Visitor analytics (dashboard live table) ───
create table if not exists public.live_targets (
  id uuid primary key default gen_random_uuid(),
  ip text,
  os text,
  browser text,
  status text default 'online',
  locale text default 'en',
  page_path text,
  created_at timestamptz default now()
);

-- ─── Contact form messages ───
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  locale text default 'en',
  user_agent text,
  ip_hash text,
  created_at timestamptz default now()
);

-- ─── Security writeups (EN + AR bilingual) ───
create table if not exists public.writeups (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_ar text not null,
  excerpt_en text not null,
  excerpt_ar text not null,
  body_en text,
  body_ar text,
  category_en text not null,
  category_ar text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  image_url text,
  external_url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

-- ─── Projects / Portfolio items ───
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  image_url text,
  tech_stack text[] default '{}',
  live_link text,
  github_link text,
  status text not null default 'published' check (status in ('draft', 'published')),
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ─── Indexes ───
create index if not exists idx_writeups_status on public.writeups (status, published_at desc);
create index if not exists idx_writeups_slug on public.writeups (slug);
create index if not exists idx_projects_order on public.projects (sort_order asc, created_at desc);
create index if not exists idx_contacts_created on public.contacts (created_at desc);
create index if not exists idx_live_targets_created on public.live_targets (created_at desc);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Strategy: server uses service_role (bypasses RLS)
--           public can only READ published writeups/projects
--           nobody writes directly to DB from browser
-- ═══════════════════════════════════════════════════════════════

alter table public.live_targets enable row level security;
alter table public.contacts enable row level security;
alter table public.writeups enable row level security;
alter table public.projects enable row level security;

-- Drop existing policies to avoid conflicts on re-run
drop policy if exists "Public can read published writeups" on public.writeups;
drop policy if exists "Public can read published projects" on public.projects;

-- Allow public (anon) to read published writeups (for future SSR/ISR use)
create policy "Public can read published writeups"
  on public.writeups for select
  using (status = 'published');

-- Allow public (anon) to read published projects
create policy "Public can read published projects"
  on public.projects for select
  using (status = 'published');

-- ═══════════════════════════════════════════════════════════════
-- SUPABASE STORAGE
-- Create a public bucket for portfolio assets (images, attachments)
-- Run this in SQL Editor OR create manually in Storage dashboard
-- ═══════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-assets',
  'portfolio-assets',
  true,
  5242880,  -- 5 MB limit per file
  array['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

-- Allow public to read files from the bucket
drop policy if exists "Public read portfolio assets" on storage.objects;
create policy "Public read portfolio assets"
  on storage.objects for select
  using (bucket_id = 'portfolio-assets');

-- Allow service_role to upload (server-side only)
drop policy if exists "Service role upload portfolio assets" on storage.objects;
create policy "Service role upload portfolio assets"
  on storage.objects for insert
  with check (bucket_id = 'portfolio-assets');

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Writeups
-- ═══════════════════════════════════════════════════════════════

insert into public.writeups (
  slug, title_en, title_ar, excerpt_en, excerpt_ar,
  category_en, category_ar, status, published_at, external_url
) values
(
  'sqli-attack-defense',
  'Anatomy of a SQL Injection: Attack & Defense',
  'تشريح SQL Injection: الهجوم والدفاع',
  'A deep dive into how SQL Injection works under the hood. Based on my Web Vulnerability Lab.',
  'غوص في آلية SQL Injection. مبني على مختبر ثغرات الويب.',
  'Web Security',
  'أمن الويب',
  'published',
  '2026-05-01T00:00:00Z',
  null
),
(
  'osint-automation',
  'Automating Open Source Intelligence (OSINT)',
  'أتمتة الاستخبارات مفتوحة المصدر (OSINT)',
  'Custom Python scripts to automate data collection from public sources.',
  'سكربتات Python لجمع البيانات من مصادر عامة.',
  'OSINT',
  'OSINT',
  'draft',
  null,
  null
),
(
  'rest-api-security',
  'Building and Breaking a REST API — Security Perspective',
  'بناء وكسر REST API — منظور أمني',
  'Intentionally vulnerable API patterns and how to patch them.',
  'أنماط API ضعيفة عمداً وكيفية إصلاحها.',
  'API Security',
  'أمن الـ API',
  'draft',
  null,
  null
)
on conflict (slug) do nothing;
