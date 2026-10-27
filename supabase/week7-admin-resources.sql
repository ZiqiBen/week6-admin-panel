-- Week 7: complete admin data model, permissions, and image storage.
-- Run after week6-admin.sql in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.llm_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.llm_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.llm_providers(id) on delete restrict,
  name text not null,
  model_key text not null unique,
  context_window integer check (context_window is null or context_window > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_chains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_chain_steps (
  id uuid primary key default gen_random_uuid(),
  prompt_chain_id uuid not null references public.prompt_chains(id) on delete cascade,
  step_order integer not null check (step_order >= 0),
  name text not null,
  prompt_template text not null,
  model_id uuid references public.llm_models(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prompt_chain_id, step_order)
);

create table if not exists public.prompt_chain_mix (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  chain_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(chain_ids) = 'array'),
  weights jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.prompt_chain_mix (name, description)
select 'Default mix', 'Default prompt chain selection mix.'
where not exists (select 1 from public.prompt_chain_mix);

create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  definition text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  prompt text not null,
  status text not null default 'pending',
  requested_media_type text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ai_generation_examples (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prompt text not null,
  response text not null,
  media_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.llm_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.generation_requests(id) on delete set null,
  model_id uuid references public.llm_models(id) on delete set null,
  response_text text not null,
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.allowed_signup_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique check (domain = lower(domain) and domain !~ '@'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whitelisted_email_addresses (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and email like '%@%'),
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  alt_text text,
  storage_path text not null unique,
  public_url text not null,
  mime_type text not null check (mime_type like 'image/%'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'llm_providers', 'llm_models', 'prompt_chains', 'prompt_chain_steps',
    'prompt_chain_mix', 'terms', 'ai_generation_examples',
    'allowed_signup_domains', 'whitelisted_email_addresses', 'images'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

create index if not exists prompt_chain_steps_chain_order_idx on public.prompt_chain_steps (prompt_chain_id, step_order);
create index if not exists generation_requests_created_at_idx on public.generation_requests (created_at desc);
create index if not exists llm_responses_created_at_idx on public.llm_responses (created_at desc);
create index if not exists images_created_at_idx on public.images (created_at desc);

-- The application still checks superadmin status in every Server Action. These
-- policies provide the database boundary if an action endpoint is called directly.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'llm_providers', 'llm_models', 'prompt_chains', 'prompt_chain_steps',
    'prompt_chain_mix', 'terms', 'generation_requests', 'ai_generation_examples',
    'llm_responses', 'allowed_signup_domains', 'whitelisted_email_addresses', 'images'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
    execute format('drop policy if exists "Superadmins can read" on public.%I', table_name);
    execute format('create policy "Superadmins can read" on public.%I for select to authenticated using (public.is_superadmin())', table_name);
  end loop;

  foreach table_name in array array[
    'llm_providers', 'llm_models', 'terms', 'ai_generation_examples',
    'allowed_signup_domains', 'whitelisted_email_addresses', 'images'
  ] loop
    execute format('grant insert, update, delete on public.%I to authenticated', table_name);
    execute format('drop policy if exists "Superadmins can create" on public.%I', table_name);
    execute format('drop policy if exists "Superadmins can update" on public.%I', table_name);
    execute format('drop policy if exists "Superadmins can delete" on public.%I', table_name);
    execute format('create policy "Superadmins can create" on public.%I for insert to authenticated with check (public.is_superadmin())', table_name);
    execute format('create policy "Superadmins can update" on public.%I for update to authenticated using (public.is_superadmin()) with check (public.is_superadmin())', table_name);
    execute format('create policy "Superadmins can delete" on public.%I for delete to authenticated using (public.is_superadmin())', table_name);
  end loop;
end $$;

grant update on public.prompt_chain_mix to authenticated;
drop policy if exists "Superadmins can update" on public.prompt_chain_mix;
create policy "Superadmins can update"
  on public.prompt_chain_mix for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

drop policy if exists "Superadmins can read profiles" on public.profiles;
create policy "Superadmins can read profiles"
  on public.profiles for select to authenticated
  using (public.is_superadmin());

drop policy if exists "Superadmins can read AI generations" on public.ai_generations;
create policy "Superadmins can read AI generations"
  on public.ai_generations for select to authenticated
  using (public.is_superadmin());

drop policy if exists "Superadmins can read ratings" on public.generation_votes;
create policy "Superadmins can read ratings"
  on public.generation_votes for select to authenticated
  using (public.is_superadmin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Superadmins can upload images" on storage.objects;
create policy "Superadmins can upload images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and public.is_superadmin());

drop policy if exists "Superadmins can update images" on storage.objects;
create policy "Superadmins can update images"
  on storage.objects for update to authenticated
  using (bucket_id = 'images' and public.is_superadmin())
  with check (bucket_id = 'images' and public.is_superadmin());

drop policy if exists "Superadmins can delete images" on storage.objects;
create policy "Superadmins can delete images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images' and public.is_superadmin());

drop policy if exists "Anyone can view public admin images" on storage.objects;
create policy "Anyone can view public admin images"
  on storage.objects for select to public
  using (bucket_id = 'images');
