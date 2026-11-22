# English with Ksenia

A private student homework portal built with Next.js, Supabase and Vercel.

## Local development

1. Install dependencies with `npm install`.
2. Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

3. Run `npm run dev`.

## Security

- Never put the Supabase service-role key in this repository or any `NEXT_PUBLIC_*` variable.
- Student login is verified by the Supabase Edge Function `student-login`.
- Homework access must be protected by Supabase Row Level Security before the dashboard is enabled.
- Do not commit `.env.local`.

## Deployment

Import this repository into Vercel and add the two public Supabase environment variables in Project Settings.

Deployment test
