# LinkUp — Social Feed & Messaging (Next.js + TypeScript)

LinkUp is a modern, responsive social feed and messaging frontend built with Next.js (App Router) and TypeScript. It combines realtime messaging, social feed features, and robust authentication in a modular, scalable codebase designed for production.

---

## Key Value
- Fast developer experience with strict TypeScript and modular feature-first architecture.
- Real-time messaging & notifications, secure auth flows, and accessible UI primitives.

---

## Features
- Authentication: signup, login, refresh tokens, logout, forgot password, verify code, reset password.
- Real-time: messaging and notifications using `socket.io-client` with a singleton socket hook (`src/socket/useAppSocket.ts`).
- State management: Redux Toolkit slices per feature (`auth`, `post`, `story`, `profile`, `message`, `notification`, `ui`).
- API client: centralized Axios instance with automatic token refresh and error handling (`src/services/api.ts`).
- Forms & validation: `react-hook-form` + `zod` via `@hookform/resolvers`.
- Media utilities: FFmpeg clients, `fabric`, `html2canvas` for client-side media processing.
- Modular UI: reusable primitives in `src/components/ui/*` (Input, Button, modals, avatar, etc.) with accessibility in mind.
- Styling: Tailwind + CSS Modules with BEM-like naming.
- Performance: code-splitting, dynamic imports, virtualization (`react-window`) and infinite scroll.
- SEO & sitemaps: route-aware sitemaps under `src/app/sitemaps`.

---

## Tech Stack
- Next.js (App Router) + React 19
- TypeScript 5 (strict mode enabled)
- Redux Toolkit, `react-redux`, `next-redux-wrapper`
- react-hook-form, zod
- socket.io-client
- Tailwind CSS + CSS Modules
- Axios, date-fns, lodash, uuid, js-cookie
- FFmpeg (`@ffmpeg/ffmpeg`), fabric, html2canvas
- framer-motion, headlessui, react-icons
- ESLint (flat config, extends `next/core-web-vitals`)

---

## Project Structure (important files & folders)

Root (pruned view):

```
package.json
next.config.ts
tsconfig.json
tailwind.config.ts
.env
public/
src/
  app/
    (auth)/
      layout.tsx
      auth-layout.module.css
      login/
        LoginClient.tsx
        LoginForm.tsx
    (main)/
      layout.tsx
      page.tsx
      (feed-search)/
        layout.tsx
        feed/
        search/
    providers.tsx
    error.tsx
  components/
    guards/
    initializers/
    seo/
    ui/
      common/
        Input/
        Button/
  services/
    api.ts
    authService.ts
    postService.ts
    profileService.ts
  socket/
    useAppSocket.ts
  store/
    index.ts
    authSlice.ts
  styles/
    globals.css
  types/
  utils/
```

Folder purposes:
- `src/app`: Next.js routes, layouts, route groups and page-level server/client components.
- `src/components`: UI primitives and feature UIs (grouped by feature).
- `src/services`: Typed service layer interacting with backend APIs.
- `src/socket`: WebSocket management and hooks for realtime interactions.
- `src/store`: Redux Toolkit configuration and slices.
- `src/styles`: global and module styles.
- `src/types` & `src/utils`: shared TypeScript models and helpers.

---

## Code Quality & Best Practices
- `tsconfig.json` uses `strict: true` for strong typing.
- Centralized API client (`src/services/api.ts`) handles 401 refresh, retry, and 429 throttling.
- Redux Toolkit patterns: slices, typed `AppDispatch` and `RootState`, and `createAsyncThunk` for side effects.
- Clear separation between server components and client components (`'use client'` where needed).
- Accessible components: ARIA attributes, live error regions, semantic form controls.
- Performance: dynamic imports, lazy loading of icons, virtualization and tailwind-based utility classes.
- Linting: ESLint configured to extend Next.js recommended rules.

---

## Getting Started

Prerequisites: Node.js 18+ recommended.

Install:

```powershell
npm install
```

Run dev:

```powershell
npm run dev
```

Build & start:

```powershell
npm run build
npm run start
```

Lint:

```powershell
npm run lint
```

---

## Environment Variables
Detected or referenced variables (see `.env`):

- `NEXT_PUBLIC_API_BASE_URL` — API base URL (e.g. `http://localhost:3000/api`). Required by `src/services/api.ts`.
- `NEXT_PUBLIC_API_URL` — base URL used for websocket connections (optional override).
- `NEXT_PUBLIC_NODE_ENV` — environment flag (present in `.env`).
- Optional commented examples present for `NEXT_PUBLIC_WEBSOCKET_URL`.

Set these in `.env.local` or in your deployment provider.

---

## Conventions & Naming
- Components: `PascalCase` files (e.g. `LoginForm.tsx`).
- Hooks: `use*` prefix (`useAppSocket`).
- Redux slices: `<feature>Slice.ts` and exported thunks are `<action>Thunk`.
- CSS Modules: `.module.css` co-located, BEM-like classnames (`auth-form__title`).
- Types: `src/types/*` with explicit interfaces and enums.
- Path alias: `@/*` mapped to `src` (configured in `tsconfig.json`).

---

## Example Snippets

- Reusable Input (accessible, react-hook-form compatible):

```tsx
// src/components/ui/common/Input/index.tsx (excerpt)
import React, { memo, useState } from 'react';

const Input = ({ id, type = 'text', label, error, required, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <fieldset className="input-block">
      {label && <label htmlFor={id}>{label}{required && '*'} </label>}
      <input id={id} type={inputType} {...props} aria-invalid={!!error} />
      {error && <span role="alert">{error}</span>}
    </fieldset>
  );
};

export default memo(Input);
```

- Centralized API with refresh handling (excerpt):

```ts
// src/services/api.ts
import axios from 'axios';
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, withCredentials: true });
api.interceptors.response.use(res => res, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && (!originalRequest._retryCount || originalRequest._retryCount < 2)) {
    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
    await api.post('/auth/refresh');
    return api(originalRequest);
  }
  return Promise.reject(error);
});
export default api;
```

---

## Testing
- No test runner or tests detected in `package.json`. Recommended additions:
  - Unit tests: `jest` + `@testing-library/react` + `ts-jest`.
  - E2E: Playwright or Cypress for critical flows (auth, messaging).

Suggested install for tests:

```powershell
npm i -D jest @testing-library/react @testing-library/jest-dom ts-jest
```

---

## Deployment
- Recommended: Vercel (native Next.js support). Make sure env vars are set in the deployment.
- Build: `npm run build` and `npm run start` for custom hosts.

Notes:
- `next.config.ts` contains remote image patterns (Cloudinary) and an SVGR webpack rule for `.svg` as React components.

---

## Screenshots & Demos
- Screenshots are not included. To add visuals, place images under `public/screenshots/` and reference them here.

---

## Contributing
- Fork → branch → PR with clear summary and tests.
- Run lint and TypeScript checks before PR:

```powershell
npm run lint
npx tsc --noEmit
```

PR checklist (suggested): types, tests, accessibility checks, small focused changes.

---

## License
- No license file was detected in the repository. If you intend to publish this repository, add a `LICENSE` file (e.g. MIT).

---

## Architecture Notes
- Feature-first layout: each feature has slice/service/components/types, making it easy to scale.
- Centralized concerns: `api.ts` (HTTP), `useAppSocket.ts` (realtime), `store/index.ts` (state) provide clear integration points.
- Opportunities: add tests, CI pipeline, and a `CONTRIBUTING.md` + `LICENSE` for OSS usage.

If you want, I can also add `CONTRIBUTING.md` and `LICENSE` (MIT) now, or scaffold a basic Jest setup.
