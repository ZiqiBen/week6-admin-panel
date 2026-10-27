# Week 6 Admin Panel Setup

## 1. Apply the database migration

In Supabase SQL Editor, run the files in this order if they have not already
been applied:

1. `supabase/week3-auth.sql`
2. `supabase/week4-ai-coach-rls.sql`
3. `supabase/week6-admin.sql`
4. `supabase/week7-admin-resources.sql`

## 2. Bootstrap the first superadmin

Sign in to the public app with Google once so your profile exists. Then run
this in Supabase SQL Editor, replacing the email with the Google account you
will use for the admin panel:

```sql
update public.profiles
set is_superadmin = true
where id = (
  select id from auth.users where email = 'your-google-email@example.com'
);
```

Never create a public route that lets a user promote themselves.

## 3. Run the admin app

The current implementation is under `/admin` in this repository. It includes:

- `/admin`: statistics dashboard
- `/admin/users`: read-only profiles
- `/admin/media`: create, read, update, and delete AI media
- `/admin/ratings`: read-only votes and rating summary
- `/admin/images`: image upload plus image create/read/update/delete
- `/admin/data/prompt-chains`: read-only prompt chains
- `/admin/data/prompt-chain-steps`: read-only prompt chain steps
- `/admin/data/prompt-chain-mix`: read/update prompt chain selection mix
- `/admin/data/terms`: terms CRUD
- `/admin/data/generation-requests`: read-only generation requests
- `/admin/data/ai-generation-examples`: AI generation example CRUD
- `/admin/data/llm-models`: LLM model CRUD
- `/admin/data/llm-providers`: LLM provider CRUD
- `/admin/data/llm-responses`: read-only LLM responses
- `/admin/data/allowed-signup-domains`: allowed signup domain CRUD
- `/admin/data/whitelisted-email-addresses`: whitelisted e-mail CRUD

The server checks both Google authentication and `profiles.is_superadmin`.
Supabase RLS policies also protect admin mutations.

## 4. Vercel deployment

For the assignment, create a second GitHub repository and Vercel project for
the admin app. Copy the repository with the admin implementation into that
new repository, or use this repository as the source only if your instructor
allows both apps in one repository.

Configure these environment variables in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_PUBLIC_APP_URL
```

Add the deployed admin URL to Supabase Authentication > URL Configuration and
Google provider settings. Turn off Vercel Deployment Protection so the app can
be checked in an Incognito window, then test that:

The admin deployment root redirects to `/admin`. Set
`NEXT_PUBLIC_PUBLIC_APP_URL` to the separate caption/rating app URL so the
admin navigation can still open the public application.

- a signed-out user is redirected to Google login;
- a signed-in non-superadmin is denied;
- a superadmin can access every admin route;
- media CRUD works;
- every Week 7 resource page has the required read/update/CRUD access;
- image upload, metadata update, viewing, and deletion work;
- users and ratings are visible;
- the public app still works.
