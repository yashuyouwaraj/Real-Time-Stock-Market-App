import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { verifyUnsubscribeTokenDetailed } from "@/lib/unsubscribe";
import { getEmailSubscriptionStatus } from "@/lib/subscription";
import EmailPreferencesClient from "@/components/EmailPreferencesClient";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function EmailPreferencesPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  let email = "";
  let tokenError = "";

  if (token) {
    const parsed = verifyUnsubscribeTokenDetailed(token);
    if (!parsed.valid || !parsed.email) {
      tokenError = parsed.reason === "expired" ? "This preferences link is expired." : "This preferences link is invalid.";
    } else {
      email = parsed.email;
    }
  } else {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    email = session?.user?.email?.trim().toLowerCase() || "";
    if (!email) {
      tokenError = "Open this page from your email link or sign in first.";
    }
  }

  if (tokenError || !email) {
    return (
      <main className="min-h-screen flex justify-center p-6 pt-10 md:pt-14 bg-gray-950/30 backdrop-blur-sm">
        <div className="max-w-xl w-full bg-gray-800/85 border border-gray-600 rounded-2xl p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-gray-100 mb-3">Cannot open preferences</h1>
          <p className="text-gray-400 mb-6">{tokenError || "Unable to identify your email."}</p>
          <Link href="/" className="search-btn">
            Back
          </Link>
        </div>
      </main>
    );
  }

  const isSubscribed = await getEmailSubscriptionStatus(email);
  if (isSubscribed === null) {
    return (
      <main className="min-h-screen flex justify-center p-6 pt-10 md:pt-14 bg-gray-950/30 backdrop-blur-sm">
        <div className="max-w-xl w-full bg-gray-800/85 border border-gray-600 rounded-2xl p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-gray-100 mb-3">Account not found</h1>
          <p className="text-gray-400 mb-6">We could not find an account for this email address.</p>
          <Link href="/" className="search-btn">
            Back
          </Link>
        </div>
      </main>
    );
  }

  return <EmailPreferencesClient token={token} email={email} initialSubscribed={isSubscribed} />;
}
