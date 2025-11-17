import Link from "next/link";
import { SignInButton } from "~/app/_components/sign-in-button";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await getSession();

  return (
    <HydrateClient>
      <main className="flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-2xl text-center">
            <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
              Welcome to{" "}
              <span className="text-blue-600">CRM</span>
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              Manage your contacts efficiently with our contact-focused CRM
              system.
            </p>

            {!session ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg text-gray-700">
                  Sign in to get started
                </p>
                <SignInButton />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <p className="text-lg text-gray-700">
                  Welcome back, <span className="font-semibold">{session.user?.name}</span>!
                </p>
                <Link
                  href="/contacts"
                  className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
                >
                  View Contacts
                </Link>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Manage Contacts
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add, edit, and organize your contacts
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Search & Filter
                    </h3>
                    <p className="text-sm text-gray-600">
                      Quickly find contacts by name, email, or company
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Organize
                    </h3>
                    <p className="text-sm text-gray-600">
                      Use tags and notes to keep track of important details
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
