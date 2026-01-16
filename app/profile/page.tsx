import { auth0 } from "@/lib/auth0";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user;

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <span>←</span> Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <div className="flex items-center gap-6">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt={user.name || 'User avatar'} 
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-blue-100">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Name</h3>
                <p className="text-gray-900">{user.name || 'Not provided'}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Email</h3>
                <p className="text-gray-900">{user.email || 'Not provided'}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Nickname</h3>
                <p className="text-gray-900">{user.nickname || 'Not provided'}</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Email Verified</h3>
                <p className="text-gray-900">
                  {user.email_verified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : (
                    <span className="text-yellow-600">Not verified</span>
                  )}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Complete User Object</h3>
              <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                <pre className="text-sm text-gray-700">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <a 
                href="/auth/logout"
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
