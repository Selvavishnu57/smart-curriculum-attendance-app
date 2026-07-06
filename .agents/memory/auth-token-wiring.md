---
name: API client auth token wiring
description: How Bearer token auth is wired from localStorage into all React Query API calls in smart-campus
---

The API client library (`@workspace/api-client-react`) exposes `setAuthTokenGetter(fn)`.  
Call it **once at module load time** (not inside a React component) so it applies to all `customFetch` calls before any React Query hooks run.

**Where it lives:** `artifacts/smart-campus/src/lib/auth.tsx` — at the module top level, before the AuthProvider definition:

```ts
import { setAuthTokenGetter } from '@workspace/api-client-react';
setAuthTokenGetter(() => localStorage.getItem('auth_token'));
```

**Why:** Without this call, every authenticated API call returns 401. The token is stored in localStorage under `auth_token` on login and removed on logout. The getter reads it lazily so it works even if the provider hasn't mounted yet.

**How to apply:** Any new app using `@workspace/api-client-react` with session-token auth must call `setAuthTokenGetter` before rendering the app tree.
