-- Week 6: superadmin authorization and admin CRUD policies.
-- Run after week3-auth.sql and week4-ai-coach-rls.sql.

alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

create index if not exists ai_generations_created_at_idx
  on public.ai_generations (created_at desc);

create index if not exists generation_votes_created_at_idx
  on public.generation_votes (created_at desc);

-- This helper avoids querying profiles directly from a policy on profiles.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_superadmin = true
  );
$$;

revoke all on function public.is_superadmin() from public;
grant execute on function public.is_superadmin() to authenticated;

drop policy if exists "Superadmins can update profiles" on public.profiles;
create policy "Superadmins can update profiles"
  on public.profiles for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

drop policy if exists "Superadmins can update AI generations" on public.ai_generations;
create policy "Superadmins can update AI generations"
  on public.ai_generations for update to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

drop policy if exists "Superadmins can delete AI generations" on public.ai_generations;
create policy "Superadmins can delete AI generations"
  on public.ai_generations for delete to authenticated
  using (public.is_superadmin());

drop policy if exists "Superadmins can create AI generations" on public.ai_generations;
create policy "Superadmins can create AI generations"
  on public.ai_generations for insert to authenticated
  with check (public.is_superadmin());

-- Bootstrap exactly one trusted account manually in Supabase SQL Editor:
-- update public.profiles set is_superadmin = true
-- where id = (select id from auth.users where email = 'YOUR_GOOGLE_EMAIL');
