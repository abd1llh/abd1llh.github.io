-- Run in Supabase SQL Editor (https://supabase.com/dashboard)
-- Portfolio backend for abd1llh.online

-- Visitor analytics (dashboard live table)
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

-- Contact form messages
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

-- Security writeups (EN + AR)
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
  external_url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_writeups_status on public.writeups (status, published_at desc);
create index if not exists idx_contacts_created on public.contacts (created_at desc);
create index if not exists idx_live_targets_created on public.live_targets (created_at desc);

alter table public.live_targets enable row level security;
alter table public.contacts enable row level security;
alter table public.writeups enable row level security;

-- No public policies: API uses service_role key only (server-side)

-- Seed writeups (matches your current portfolio content)
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
