# 📘 ADMIN_AI_RULES.md

## Project: PP02 Admin Panel

Stack: Next.js + TypeScript + React Query + Tailwind + shadcn/ui

---

# 🎯 PURPOSE

This document defines strict rules that any AI assistant (GitHub Copilot, Claude, ChatGPT, etc.) must follow when generating code for the Admin Panel.

AI must NOT break architecture, conventions, or security rules.

---

# 1️⃣ CORE STACK (MANDATORY)

Framework: Next.js (App Router)
Language: TypeScript

UI:

* TailwindCSS
* shadcn/ui

State Management:

* @tanstack/react-query

Forms:

* react-hook-form
* zod

HTTP Client:

* axios

❌ AI must NOT:

* Use Redux unless explicitly requested
* Use class components
* Use other UI frameworks (Antd, MUI, Bootstrap)
* Replace React Query with another library

---

# 2️⃣ PROJECT STRUCTURE (MANDATORY)

AI must follow this structure:

```bash
src/
│
├── app/
│   ├── (auth)/
│   │   └── login/
│   │
│   ├── (dashboard)/
│   │   ├── users/
│   │   ├── roles/
│   │   └── <new-module>/
│
├── components/
│   ├── ui/
│   ├── common/
│   ├── forms/
│   └── tables/
│
├── modules/
│   ├── users/
│   ├── roles/
│   └── <new-module>/
│
├── lib/
│   ├── axios.ts
│   ├── auth.ts
│   ├── query-client.ts
│
├── constants/
├── types/
└── utils/
```

❌ AI must NOT:

* Create random folder structures
* Place business logic inside `app/` pages
* Mix modules together

---

# 3️⃣ ARCHITECTURE RULE (STRICT)

Must follow:

```
Page → Hook → API → Backend
```

Page:

* UI rendering only
* No API calls
* No business logic

Hook:

* Use React Query
* Call API functions
* Handle state (loading, error, data)

API:

* Axios calls only
* No UI logic

❌ Page must NEVER call axios directly
❌ Page must NEVER contain business logic

### ✅ Example — Correct Layer Separation

```tsx
// ✅ modules/users/api.ts
import { axiosInstance } from '@/lib/axios';
import { GetUsersParams, ApiResponse, User } from './types';

export const getUsers = async (params: GetUsersParams): Promise<ApiResponse<User[]>> => {
  const { data } = await axiosInstance.get('/users', { params });
  return data;
};

export const createUser = async (payload: CreateUserPayload): Promise<ApiResponse<User>> => {
  const { data } = await axiosInstance.post('/users', payload);
  return data;
};
```

```ts
// ✅ modules/users/hooks/use-users.ts
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api';
import { userKeys } from './query-keys';

export const useUsers = (page: number, limit: number) => {
  return useQuery({
    queryKey: userKeys.list(page, limit),
    queryFn: () => getUsers({ page, limit }),
  });
};
```

```tsx
// ✅ app/(dashboard)/users/page.tsx
import { useUsers } from '@/modules/users/hooks/use-users';

export default function UsersPage() {
  const { data, isLoading, isError } = useUsers(1, 10);
  // UI only — no axios, no business logic
  return <UserTable data={data} isLoading={isLoading} isError={isError} />;
}
```

---

# 4️⃣ MODULE STRUCTURE RULE

Each module MUST include:

```bash
modules/<module-name>/
│
├── api.ts
├── types.ts
├── schema.ts
├── hooks/
│   ├── query-keys.ts        ← REQUIRED
│   ├── use-<module>.ts
│   └── use-<module>-mutation.ts
├── components/
```

AI must:

* Keep module self-contained
* Not mix logic between modules

---

# 5️⃣ API RULE

All API calls must:

* Use axios instance from `lib/axios.ts`
* Use typed responses
* Follow backend response format

Example response:

```ts
{
  success: boolean
  message: string
  data: any
}
```

❌ AI must NOT:

* Call fetch directly
* Hardcode URLs
* Ignore typing
* Use `process.env` directly inside `api.ts` — base URL is handled in `lib/axios.ts`

---

# 6️⃣ ENVIRONMENT VARIABLE RULE

All configuration must come from environment variables. Never hardcode values.

```ts
// ✅ lib/axios.ts
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
});
```

Required env variables:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

❌ AI must NOT:

* Hardcode base URLs anywhere
* Use `process.env` directly inside module `api.ts`
* Commit `.env` files

---

# 7️⃣ AUTHENTICATION RULE

AI must:

* Store token in:

  * httpOnly cookie OR
  * localStorage (if required)

* Use Axios interceptor to attach token:

```ts
// ✅ lib/axios.ts — interceptor setup
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      // Show permission error toast
    }
    return Promise.reject(error);
  }
);
```

* Handle:

  * 401 → redirect to login
  * 403 → show permission error toast

❌ AI must NOT:

* Hardcode token
* Skip auth handling

---

# 8️⃣ PERMISSION RULE

AI must:

* Wrap restricted UI elements with `<PermissionGuard>`
* Never scatter inline permission checks across pages

```tsx
// ✅ Correct — use guard component
<PermissionGuard permission="users:delete">
  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
</PermissionGuard>

// ❌ Wrong — inline check scattered in page
{user.role === 'admin' && <Button onClick={handleDelete}>Delete</Button>}
```

Rules:

* Permission keys follow format: `<module>:<action>` (e.g., `users:create`, `roles:edit`)
* Guard component lives in `components/common/permission-guard.tsx`
* Route-level guard lives in layout, not in page component

---

# 9️⃣ FORM RULE

All forms must use:

* react-hook-form
* zod for validation

Rules:

* Validation schema must be in `schema.ts`
* Form logic must NOT be inside page
* Use reusable form components from `components/forms/`

```ts
// ✅ modules/users/schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  roleId: z.string().uuid('Invalid role'),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
```

---

# 🔟 TABLE & LIST RULE

All list pages must support:

* Pagination:

  * page
  * limit

* Optional:

  * search
  * filter

Must use:

* TanStack Table

Must display:

* Loading state (skeleton)
* Empty state
* Error state

❌ AI must NOT:

* Render full dataset without pagination

---

# 1️⃣1️⃣ REACT QUERY RULE

AI must:

* Use:

  * `useQuery` → GET
  * `useMutation` → POST/PUT/DELETE

* Define query keys in `hooks/query-keys.ts` inside each module:

```ts
// ✅ modules/users/hooks/query-keys.ts
export const userKeys = {
  all: ['users'] as const,
  list: (page: number, limit: number) => ['users', page, limit] as const,
  detail: (id: string) => ['users', id] as const,
};
```

* Invalidate queries after mutation:

```ts
// ✅ After create/update/delete
queryClient.invalidateQueries({ queryKey: userKeys.all });
```

❌ AI must NOT:

* Inline query key strings in `useQuery` calls
* Skip invalidation after mutation

---

# 1️⃣2️⃣ NOTIFICATION RULE

All user feedback after actions must use shadcn/ui `toast`.

```tsx
// ✅ Correct
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

// On success
toast({ title: 'Success', description: response.message, variant: 'default' });

// On error
toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
```

Rules:

* Success toast: use `message` from API response
* Error toast: show user-friendly message, NOT raw backend error
* Never use `alert()`, `console.log()`, or custom notification libraries

❌ AI must NOT:

* Expose raw API error messages to users
* Use `alert()` for any feedback

---

# 1️⃣3️⃣ ERROR HANDLING RULE

AI must:

* Handle API errors gracefully in hooks
* Show user-friendly messages via toast
* Not expose raw backend errors

```ts
// ✅ useMutation with error handling
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: (res) => {
    toast({ title: 'Success', description: res.message });
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  },
  onError: (error: AxiosError<ApiResponse>) => {
    const message = error.response?.data?.message ?? 'Something went wrong';
    toast({ title: 'Error', description: message, variant: 'destructive' });
  },
});
```

---

# 1️⃣4️⃣ LOADING & UX RULE

AI must:

* Show loading skeleton for list pages
* Show spinner for form submissions
* Disable submit buttons while `isPending` is true
* Prevent duplicate requests

```tsx
// ✅ Disable button while submitting
<Button type="submit" disabled={mutation.isPending}>
  {mutation.isPending ? <Spinner /> : 'Save'}
</Button>
```

---

# 1️⃣5️⃣ TYPES & VALIDATION RULE

AI must:

* Define types in `types.ts`
* Use strict TypeScript typing
* Never use `any`

```ts
// ✅ Use unknown + type narrowing instead of any
function parseResponse(data: unknown): User {
  if (!isUser(data)) throw new Error('Invalid user data');
  return data;
}

// ⚠️ Acceptable exception — third-party lib without types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pluginOptions = thirdPartyLib.init(config as any); // No types available for this lib
```

❌ AI must NOT:

* Use `any` as a shortcut
* Skip typing API responses

---

# 1️⃣6️⃣ NAMING CONVENTION

* Files: kebab-case
* Components: PascalCase
* Variables: camelCase
* Hooks: `useSomething`
* Query keys file: `query-keys.ts`
* Permission keys: `<module>:<action>`

Example:

```bash
user-table.tsx
use-users.ts
use-users-mutation.ts
create-user-form.tsx
query-keys.ts
```

---

# 1️⃣7️⃣ WHEN GENERATING NEW MODULE

AI must:

1. Create folder in `modules/`

2. Add:

   * `api.ts`
   * `types.ts`
   * `schema.ts`
   * `hooks/query-keys.ts`
   * `hooks/use-<module>.ts`
   * `hooks/use-<module>-mutation.ts`
   * `components/`

3. Create pages in `app/(dashboard)/<module>/`

4. Implement:

   * List page (with pagination, loading, empty, error states)
   * Create page (with form + validation)
   * Edit page (with pre-filled form + validation)

5. Add:

   * Pagination
   * Zod validation schema
   * Toast notifications
   * Permission guards on restricted actions
   * Error handling in mutations

---

# 1️⃣8️⃣ PERFORMANCE RULE

AI must:

* Avoid unnecessary re-renders
* Use `React.memo` only when profiling confirms a re-render issue — NOT by default
* Keep components small and single-responsibility
* Lazy load heavy components with `dynamic()` from Next.js

```tsx
// ✅ Lazy load heavy components
const HeavyChart = dynamic(() => import('@/components/common/heavy-chart'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});
```

❌ AI must NOT:

* Apply `React.memo` everywhere by default
* Use optimistic updates unless explicitly requested

---

# 1️⃣9️⃣ SECURITY RULE

AI must:

* Not expose sensitive data in UI or console
* Sanitize inputs (zod handles this at form level)
* Prevent XSS — never use `dangerouslySetInnerHTML` unless explicitly required
* Never log tokens or user credentials

---

# 2️⃣0️⃣ UI RULE

AI must:

* Use shadcn/ui components
* Follow clean admin layout
* Ensure responsive design
* Use Tailwind utility classes, not inline styles

❌ AI must NOT:

* Use inline styles excessively
* Create messy, unstructured UI
* Use `dangerouslySetInnerHTML`

---

# 2️⃣1️⃣ CLEAN CODE RULE

AI must:

* Keep components small (< 150 lines per file as guideline)
* Avoid duplication — extract reusable hooks and components
* Use clear, descriptive naming
* One component per file

---

# 🚫 DO NOT BREAK

AI must NOT:

* Change folder structure
* Skip hooks layer
* Call API inside page
* Ignore React Query
* Ignore validation
* Ignore pagination
* Hardcode URLs or tokens
* Use `any` as a shortcut
* Skip toast notifications after mutations
* Omit permission guards on restricted actions

---

# 🚀 FINAL INSTRUCTION FOR AI

When generating any feature:

* Respect architecture: `Page → Hook → API`
* Respect module structure (including `query-keys.ts`)
* Respect typing & validation (no `any`)
* Respect backend response format
* Respect pagination & UX (skeleton / empty / error states)
* Respect security rules
* Use toast for all user feedback
* Use `PermissionGuard` for restricted actions
* Use env variables — never hardcode

**If unsure → follow the existing `users` module as the reference pattern.**

---

# 🔥 BONUS (OPTIONAL BUT RECOMMENDED)

If backend Swagger is available:

* Generate types from Swagger
* Sync API contracts
* Avoid manual typing mismatch

Consider adding an OpenAPI → TypeScript codegen step (e.g., `openapi-typescript`) to keep `types.ts` always in sync with the backend.