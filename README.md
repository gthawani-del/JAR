# JAR Advisory

Phase 1 foundation for the JAR Advisory premium marketing website and Ask JAR intelligence console.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-ready component structure
- Framer Motion-ready motion layer
- React Three Fiber / Three.js hero visual
- Supabase schema, RLS, storage, analytics, and Ask JAR conversation foundation

## Environment

Copy `.env.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` must remain server-side only.

## Package manager

This repo uses npm with exact dependency versions and the public npm registry configured in `.npmrc`. No private packages are required.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```
