# Auth0 Next.js SDK Integration

This repository demonstrates the integration of Auth0 authentication into a Next.js application using the official [@auth0/nextjs-auth0](https://github.com/auth0/nextjs-auth0) SDK version 4.

## Overview

The integration showcases:
- Server-side authentication using Auth0 SDK v4
- Protected routes with automatic redirects
- User session management
- Modern Next.js 16 patterns (proxy middleware)
- Type-safe implementation with TypeScript
- Beautiful UI with Tailwind CSS

## Key Files

### Core Auth0 Integration

- **`lib/auth0.ts`** - Auth0 client instance
  ```typescript
  import { Auth0Client } from "@auth0/nextjs-auth0/server";
  export const auth0 = new Auth0Client();
  ```

- **`proxy.ts`** - Authentication middleware for Next.js 16
  ```typescript
  import { auth0 } from "./lib/auth0";
  
  export async function proxy(request: Request) {
    return await auth0.middleware(request);
  }
  ```

### Pages

- **`app/page.tsx`** - Home page with login/logout
- **`app/profile/page.tsx`** - Protected profile page

## Authentication Flow

1. User visits the application
2. Clicks "Login" which redirects to `/auth/login`
3. Auth0 SDK handles the OAuth flow
4. User is redirected back to the application at `/auth/callback`
5. Session is created and user can access protected routes
6. Profile page shows user information
7. Logout via `/auth/logout` clears the session

## Environment Variables

The application requires these environment variables (see `.env.example`):

- `APP_BASE_URL` - Your application URL
- `AUTH0_CLIENT_ID` - From Auth0 Dashboard
- `AUTH0_CLIENT_SECRET` - From Auth0 Dashboard
- `AUTH0_DOMAIN` - Your Auth0 tenant domain
- `AUTH0_SECRET` - Generated secret for session encryption

## Routes

The Auth0 SDK automatically provides these routes via the proxy middleware:

- `/auth/login` - Initiates login
- `/auth/logout` - Logs out user
- `/auth/callback` - Handles OAuth callback

## Protected Routes Pattern

```typescript
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth0.getSession();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return <div>Protected content for {session.user.name}</div>;
}
```

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Auth0** - Authentication
- **@auth0/nextjs-auth0 v4** - Auth0 SDK

## Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Auth0 credentials
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Learn More

- [Auth0 Next.js SDK Documentation](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Next.js Documentation](https://nextjs.org/docs)
