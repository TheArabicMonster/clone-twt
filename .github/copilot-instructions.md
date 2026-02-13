# Copilot Instructions — araTexT (clone Twitter)

## Architecture

Next.js 16 App Router (TypeScript) + Prisma (MongoDB) + NextAuth v5 (beta) + HeroUI + Tailwind CSS v4.

### Route Groups & Sidebar

Pages use **route groups** to control layout:

- `src/app/(main)/` — Pages with sidebar (`AppShell` → `Sidebar`): timeline, messages, profile
- `src/app/(auth)/` — Auth pages without sidebar: login, signup
- `src/app/page.tsx` — Landing page, no sidebar

When creating a new page, place it in the correct route group. The sidebar is injected via `src/app/(main)/layout.tsx` — never wrap pages in `<AppShell>` directly.

### Key Directories

- `src/lib/` — Shared server utilities: Prisma client (`prisma.ts`), NextAuth config (`auth.ts`, `auth.config.ts`), auth helpers (`auth-helpers.ts`)
- `src/components/` — Shared React components (both client and server)
- `src/app/api/` — API routes (REST, Next.js Route Handlers)
- `src/types/` — Type augmentations (e.g., `next-auth.d.ts` extends Session with `id`, `username`, `pseudo`)
- `prisma/schema.prisma` — Data models: User, Tweet, Like, Comment, Follow (MongoDB with ObjectId)

### Authentication Flow

- NextAuth v5 with credentials provider (username + bcrypt password)
- JWT strategy — session data includes `id`, `username`, `pseudo`
- Server-side: use `auth()` from `@/lib/auth` or helpers `requireAuth()` / `requireGuest()` from `@/lib/auth-helpers`
- Client-side: use `signIn` / `signOut` from `next-auth/react`

## Conventions

### Code Style

- **Language**: UI text and comments are in **French**
- **Imports**: Use `@/*` path alias (maps to `./src/*`)
- **Components**: Client components use `"use client"` directive; server components are default
- **Validation**: Zod schemas for form validation (with `react-hook-form` + `@hookform/resolvers`)
- **UI library**: HeroUI components (`@heroui/button`, `@heroui/card`, `@heroui/input`, `@heroui/modal`, etc.) — not shadcn/ui
- **Icons**: `lucide-react`
- **Dates**: Serialize `DateTime` fields to ISO strings before passing to client components

### API Routes Pattern

```typescript
// Always check auth first
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}
// Next.js 16 params are Promises
const { username } = await params;
```

### Prisma

- MongoDB provider — IDs use `@db.ObjectId`
- Singleton pattern in `src/lib/prisma.ts` (global cache in dev)
- After schema changes: `npx prisma generate` then `npx prisma db push`

## Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` (uses `--webpack` flag) |
| Build | `pnpm build` (Turbopack, may need `--turbopack` flag) |
| Tests | `pnpm test` (Jest + Testing Library) |
| Lint | `pnpm lint` (ESLint flat config) |
| Prisma generate | `npx prisma generate` |
| Prisma push | `npx prisma db push` |

## Important Notes

- **Package manager**: pnpm (monorepo workspace via `pnpm-workspace.yaml`)
- **PowerShell restriction**: On this Windows machine, `npx` must be run via `cmd /c "npx ..."` due to execution policy
- **Prisma + Next.js**: `@prisma/client` and `bcryptjs` are listed in `serverExternalPackages` in `next.config.ts`
- **next-cloudinary** is available for image uploads (Cloudinary integration)
