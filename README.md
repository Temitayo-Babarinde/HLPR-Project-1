# hlpr — Hunter College edition

HLPR is a private class workspace for Hunter College students. Students can find their course section, talk with classmates, maintain shared tasks, and collaborate on a living syllabus from one responsive dashboard.

## Stack

- Next.js 16 App Router
- React 19
- Supabase Auth, Postgres, RPC functions, and row-level security
- Vercel hosting

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the values from the Supabase project API settings.
4. Run `supabase/schema.sql` in the Supabase SQL editor if the database has not been provisioned.
5. In Supabase Auth, add `http://localhost:3000/auth/confirm` as an allowed redirect URL.
6. Start the app with `npm run dev` and open `http://localhost:3000`.

## Authentication and security

- Registration accepts `@myhunter.cuny.edu` and `@login.cuny.edu` addresses.
- New accounts confirm their email through `/auth/confirm` before signing in.
- The allowed-domain rule is checked in the interface and enforced by the database user-creation trigger.
- Protected pages validate the user on the server and refresh Supabase auth cookies through the proxy.
- Row-level security limits class content to enrolled students; privileged RPC functions have explicit grants.
- Never place a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable or commit it to the repository.

## Included features

- Hunter and CUNY Login email/password registration, confirmation, sign-in, resend, and reliable sign-out
- Find-or-create class joining with a live section preview
- Responsive class dashboard with section, semester, and professor details
- Realtime class discussions with nested replies, search, and drafting counters
- Shared tasks with Open, Done, and All filters plus completion progress
- Shared syllabus with autosave status, word count, and one-click copy
- Private searchable class roster visible only to enrolled students
- Keyboard skip navigation, visible focus states, responsive layouts, and branded page recovery

## Deploying to Vercel

1. Import this repository into Vercel and keep the framework preset set to Next.js.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Production, Preview, and Development environments.
3. Add `https://<your-domain>/auth/confirm` to the Supabase Auth redirect allow list.
4. Deploy. Vercel runs `npm run build` automatically.

The publishable key is safe to expose to the browser; authorization must remain enforced by Supabase row-level security. Do not add a service-role key to Vercel variables used by client code.

## Verification

```bash
npm run lint
npm run build
```

Run both commands before pushing changes to `main`.
