# Algorithm Pattern Atlas — Assignment 2

The original Week 1 Next.js app, extended with a Supabase-backed algorithm pattern atlas.

## Setup

1. Create a Supabase project and run the SQL files in order: `supabase/schema.sql`, `supabase/week3-auth.sql`, `supabase/week4-ai-coach-rls.sql`, `supabase/week5-personal-progress-rls.sql`, `supabase/week6-admin.sql`, and `supabase/week7-admin-resources.sql`.
2. Copy `.env.example` to `.env.local` and fill in the project URL and legacy anon key from Supabase. Never use a service-role key.
3. Run `npm install` and `npm run dev`.
4. Open http://localhost:3000.

`.env.local` is ignored by Git. `.env.example` contains only variable names.

## How it works

`app/page.tsx` is an async Server Component. It reads the Supabase URL and anon key from environment variables, selects algorithm pattern rows, and renders a card for each row. `connection()` makes the query run at request time, so database edits appear on the next page load. Empty and failed queries have separate messages.

The SQL script creates thirty-two sample patterns and enables Row Level Security. Anonymous and authenticated visitors have SELECT access only; no public insert, update, or delete access is granted.

The protected `/admin` area provides the complete operations interface for profiles, prompt chains and steps, prompt-chain mix, terms, generated media, generation requests and examples, LLM providers/models/responses, signup allowlists, and uploaded images. Every write is checked against `profiles.is_superadmin` in both the Server Action and Supabase RLS.

Signed-in users can mark each pattern's example problem as solved. Those rows power a private Algorithm Galaxy on the homepage. RLS on `solved_problems` restricts every select, insert, and delete to the row owner, so one account cannot see or change another account's progress.

## Vercel deployment

Continue using the existing Vercel project connected to this repository. Add these environment variables to both Production and Preview before deploying:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Run `npm run build` and `npm run lint`, commit and push the changes, and verify the resulting Vercel deployment. Deployment Protection must be disabled for the assignment. Open the unique deployment URL in an incognito window and verify that the pattern cards appear. Submit the unique URL associated with the final commit, rather than the moving production or branch alias.
