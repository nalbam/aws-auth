import { auth0 } from "@/lib/auth0";
import Link from "next/link";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Auth0 Next.js Integration
            </h1>
            <p className="text-gray-600 text-lg">
              This application demonstrates integration with Auth0 authentication using the latest Next.js SDK.
            </p>
          </header>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              You are not logged in
            </h2>
            <p className="text-gray-600 mb-6">
              Please log in to access protected features and view your profile.
            </p>
            <a 
              href="/auth/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </a>
          </div>

          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Features</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Secure authentication with Auth0</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Protected routes and pages</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>User profile management</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Session management</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  const user = session.user;

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Auth0 Next.js Integration
          </h1>
          <p className="text-gray-600 text-lg">
            This application demonstrates integration with Auth0 authentication.
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Hello, {user.name}!
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
            {user.picture && (
              <img 
                src={user.picture} 
                alt={user.name || 'User avatar'} 
                className="w-16 h-16 rounded-full"
              />
            )}
          </div>
          
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">User Information</h3>
              <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div className="flex gap-4 mt-6">
              <Link 
                href="/profile"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Profile
              </Link>
              <a 
                href="/auth/logout"
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Features</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Secure authentication with Auth0</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Protected routes and pages</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>User profile management</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Session management</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
