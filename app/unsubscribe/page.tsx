import Link from "next/link";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ token?: string; status?: string }>;
};

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token, status } = await searchParams;

  // Backward compatibility for previously generated /unsubscribe?token=... links.
  if (token) {
    redirect(`/api/unsubscribe?token=${encodeURIComponent(token)}`);
  }

  const normalizedStatus = (status || "invalid").toLowerCase();
  const isSuccess = normalizedStatus === "success";

  let title = "Unsubscribe link is invalid";
  let description =
    "This link is expired or malformed. Please use the latest unsubscribe link from your email inbox.";

  if (isSuccess) {
    title = "You are unsubscribed";
    description = "This email address will no longer receive Signalist marketing emails.";
  } else if (normalizedStatus === "not-found") {
    title = "Account not found";
    description = "We could not find a matching account for this unsubscribe link.";
  } else if (normalizedStatus === "expired") {
    title = "Unsubscribe link expired";
    description = "This unsubscribe link has expired. Please use the latest one from your inbox.";
  } else if (normalizedStatus === "error") {
    title = "Something went wrong";
    description = "We could not process your request right now. Please try again shortly.";
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-gray-800 border border-gray-600 rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-gray-100 mb-3">{title}</h1>
        <p className="text-gray-400 mb-6">{description}</p>
        <Link href="/" className="search-btn">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
