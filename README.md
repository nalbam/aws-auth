# Auth0 Next.js Integration

This is a Next.js application integrated with Auth0 authentication using the [@auth0/nextjs-auth0](https://github.com/auth0/nextjs-auth0) SDK.

## Features

- 🔐 Secure authentication with Auth0
- 👤 User profile management
- 🛡️ Protected routes
- 🎨 Modern UI with Tailwind CSS
- ⚡ Built with Next.js 14+ App Router
- 📱 Responsive design

## Prerequisites

- Node.js 18.x or later
- An Auth0 account (sign up at [auth0.com](https://auth0.com))

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/nalbam/aws-auth.git
cd aws-auth
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Auth0

1. Go to the [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new application (Regular Web Application)
3. Configure the following settings in your Auth0 application:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

### 4. Configure environment variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your Auth0 credentials:
   ```env
   APP_BASE_URL=http://localhost:3000
   AUTH0_CLIENT_ID=your_auth0_client_id
   AUTH0_CLIENT_SECRET=your_auth0_client_secret
   AUTH0_DOMAIN=your_domain.auth0.com
   AUTH0_SECRET=your_long_secret_value_at_least_32_characters
   ```

   You can generate a secret with:
   ```bash
   openssl rand -hex 32
   ```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
aws-auth/
├── app/
│   ├── profile/
│   │   └── page.tsx                  # Protected profile page
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Global styles
├── lib/
│   └── auth0.ts                      # Auth0 client instance
├── proxy.ts                          # Auth0 middleware (Next.js 16)
├── .env.example                      # Environment variables template
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Project dependencies
```

## Usage

### Authentication Flow

1. **Login**: Click the "Login" button to authenticate with Auth0
2. **View Profile**: Once logged in, access the profile page to see user information
3. **Logout**: Click the "Logout" button to end the session

### Protecting Routes

The profile page demonstrates how to protect routes using server components:

```tsx
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <div>Hello {session.user.name}</div>;
}
```

### Authentication in Server Components

Server components can directly access the session:

```tsx
import { auth0 } from "@/lib/auth0";

export default async function ServerPage() {
  const session = await auth0.getSession();
  
  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Hello {session.user.name}</div>;
}
```

## API Routes

The Auth0 SDK automatically handles authentication routes through the proxy middleware:

- `/auth/login` - Initiates the login flow
- `/auth/logout` - Logs out the user
- `/auth/callback` - Handles the callback from Auth0

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_BASE_URL` | The base URL of your application | Yes |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | Yes |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | Yes |
| `AUTH0_DOMAIN` | Auth0 tenant domain (e.g., dev-xxx.us.auth0.com) | Yes |
| `AUTH0_SECRET` | Secret for encrypting session cookies (min 32 chars) | Yes |

## Build and Deploy

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

### Deploy to Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables in the Vercel dashboard
4. Update the `AUTH0_BASE_URL` to your production URL
5. Update the Auth0 application settings with your production URLs

## Learn More

- [Auth0 Next.js SDK Documentation](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Auth0 Documentation](https://auth0.com/docs)

## License

ISC