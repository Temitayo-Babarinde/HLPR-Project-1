# hlpr — Hunter College edition

HLPR helps Hunter students find classmates, share a syllabus page, and maintain a collaborative task board for each course section.

## Stack

- Next.js 16 App Router
- React 19
- Supabase Auth, Postgres, RPC functions, and row-level security
- Vercel hosting

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase project URL and publishable key.
4. Run `supabase/schema.sql` in a new Supabase project if the database has not been provisioned.
5. Start the app with `npm run dev`.

Only `@myhunter.cuny.edu` and `@login.cuny.edu` addresses can create accounts. The restriction is checked in the interface and enforced inside the database user-creation transaction. Never place a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

## Included features

- Hunter and CUNY Login email/password registration and sign-in
- Protected server-rendered routes and refreshed auth cookies
- Find-or-create class joining through a race-safe database function
- Personal class dashboard and sign out
- Private class roster visible only to enrolled students
- Shared syllabus with debounced save status
- Shared task creation and completion
- Row-level security and restricted privileged functions

## Verification

```bash
npm run lint
npm run build
```

Both commands pass in the completed project.
