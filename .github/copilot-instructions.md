# AI Coding Instructions for Project Flow

## Architecture Overview

**Project Flow** is a TypeScript + React financial management and scheduling dashboard built with Vite and shadcn-ui.

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn-ui (Radix UI primitives) + Tailwind CSS
- **State Management**: React Query (TanStack Query) for server state
- **Authentication**: Supabase (email OTP + password)
- **Routing**: React Router v6
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS with custom color schemes (dark mode enabled via CSS class)

### Directory Structure
- `src/components/` - React components organized by domain:
  - `dashboard/` - Dashboard-specific widgets (charts, stats, transactions)
  - `layout/` - Global layout (Header with navigation, Sidebar if present)
  - `tables/` - Reusable data tables
  - `ui/` - Shadcn-ui component library (pre-built, don't modify unless adding new)
- `src/lib/` - Business logic and service layers (auth, reservations, supabase client)
- `src/hooks/` - Custom React hooks (useAuth, useDashboardStats, etc.)
- `src/pages/` - Page-level components (one per route)
- `src/types/` - TypeScript interfaces and types

## Authentication & Authorization

Authentication is handled via [src/hooks/useAuth.ts](src/hooks/useAuth.ts) and [src/lib/auth.ts](src/lib/auth.ts):

1. **Session Management**: `useAuth()` hook wraps Supabase auth with React state. Returns `user`, `loading`, and auth methods.
2. **Auth Flow**: Email OTP → verify token → set password (optional). See [src/pages/Auth.tsx](src/pages/Auth.tsx) for UI.
3. **Protected Routes**: [src/App.tsx](src/App.tsx) checks `user` state; unauthenticated users see Auth page.
4. **Error Handling**: All auth errors are thrown; UI layer catches and displays via `sonner` toast notifications.

**Example pattern for auth-dependent operations**:
```tsx
const { user, loading } = useAuth();
if (loading) return <LoadingSpinner />;
if (!user) return <Navigate to="/login" />;
// Use user.id for queries
```

## Data Fetching & Caching

1. **React Query Setup**: [src/App.tsx](src/App.tsx) configures QueryClient with 5-minute stale time and no window-focus refetch.
2. **Service Functions**: Database queries live in `src/lib/` (e.g., [src/lib/reservations.ts](src/lib/reservations.ts)).
   - All functions validate auth and throw errors explicitly
   - Return typed responses matching interfaces in [src/types/index.ts](src/types/index.ts)
3. **User Scoping**: Every query checks `getUser()` and filters by `user_id` for multi-tenant safety.

**Creating new data service**:
- Add TypeScript interface in [src/types/index.ts](src/types/index.ts)
- Create service file in `src/lib/{feature}.ts` with exported async functions
- Use in components with React Query hooks (e.g., `useQuery` from `@tanstack/react-query`)

## UI & Styling Conventions

1. **Component Library**: Use shadcn-ui components from [src/components/ui/](src/components/ui/). Avoid custom component libraries.
2. **Tailwind Classes**: Apply classes directly; no CSS files except [src/App.css](src/App.css) and [src/index.css](src/index.css) for globals.
3. **Dark Mode**: Configured via CSS class (from `next-themes`). Use `dark:` prefix for dark variants.
4. **Button/Form Patterns**: [src/components/ui/button.tsx](src/components/ui/button.tsx) and form components use `class-variance-authority` for variants.
5. **Responsive**: Mobile-first approach; use `sm:`, `md:`, `lg:` breakpoints in Tailwind.

**Component template**:
```tsx
import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/lib/data';

interface ComponentProps {
  id: string;
}

export const MyComponent: FC<ComponentProps> = ({ id }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data', id],
    queryFn: () => fetchData(id),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div className="p-4 rounded-lg border bg-card">
      {/* Content */}
    </div>
  );
};
```

## Type System & Data Flow

- **TypeScript Path Alias**: `@/` resolves to `src/` (configured in [tsconfig.json](tsconfig.json))
- **Strict Types**: Define all data structures in [src/types/index.ts](src/types/index.ts). Current entities: Client, Budget, Transaction, Card, Purchase, Installment, Investment, Reservation, Project.
- **Error Handling**: No implicit `any` in types. Use explicit error types or `Error` class.
- **Null Handling**: `strictNullChecks` is **disabled** in tsconfig; use optional chaining (`?.`) for safety.

## Development Workflow

### Commands
- `npm run dev` - Start Vite dev server (port 5173)
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

### Environment Variables
Supabase connection requires:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Code Style
- **ESLint Config**: [eslint.config.js](eslint.config.js) enforces React best practices (hooks rules) and TypeScript recommendations.
- **Unused Variables**: Disabled in config (`@typescript-eslint/no-unused-vars: off`)
- **React Refresh**: Fast refresh enabled via `@vitejs/plugin-react-swc`

## Feature Development Checklist

When adding a new feature (e.g., new page or data entity):

1. **Define Type**: Add interface to [src/types/index.ts](src/types/index.ts)
2. **Service Layer**: Create `src/lib/{feature}.ts` with fetch/CRUD functions
3. **Page Component**: Create `src/pages/{Feature}.tsx` for route
4. **Add Route**: Register in [src/App.tsx](src/App.tsx) routes and nav in [src/components/layout/Header.tsx](src/components/layout/Header.tsx)
5. **UI Components**: Use shadcn components for forms, tables, dialogs
6. **Error Handling**: Use `sonner` toast for user feedback (`toast.success()`, `toast.error()`)
7. **Lint Check**: Run `npm run lint` before committing

## Common Gotchas

- **Hardcoded i18n**: App uses Portuguese labels (UI is PT-BR). Add translations if expanding to other languages.
- **Tailwind Class Safety**: No custom CSS file usage in components; stick to Tailwind utilities.
- **Reactive Data**: React Query handles server state; use `useQuery` not manual `useState` fetching.
- **Auth on Page Load**: Always check `useAuth()` in page components; don't assume user exists.
- **Supabase Queries**: Use `select()` to specify columns; reduce payload and improve security.
