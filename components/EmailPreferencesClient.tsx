"use client";

import { ArrowLeft, BellRing, MailCheck, MailX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  token?: string;
  initialSubscribed: boolean;
  email: string;
};

const EmailPreferencesClient = ({ token, initialSubscribed, email }: Props) => {
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const updatePreference = async (action: "subscribe" | "unsubscribe") => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, token }),
      });
      const data = (await response.json().catch(() => null)) as { success?: boolean; error?: string; isSubscribed?: boolean } | null;

      if (!response.ok || !data?.success) {
        setMessage("Could not update preferences right now. Please try again.");
        return;
      }

      const nextSubscribed = data.isSubscribed === true;
      setIsSubscribed(nextSubscribed);
      setMessage(nextSubscribed ? "You are subscribed to marketing emails." : "You are unsubscribed from marketing emails.");
    } catch {
      setMessage("Could not update preferences right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(250,204,21,0.08),_rgba(17,24,39,0.95)_45%)] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-700/80 bg-gray-900/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-100 md:text-3xl">Email Preferences</h1>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/");
            }}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-gray-600 bg-gray-800 px-3 text-sm text-gray-200 transition-colors hover:border-yellow-400 hover:text-yellow-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-gray-700/80 bg-gray-800/70 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-gray-400">Account Email</p>
          <p className="mt-1 text-sm font-medium text-gray-100">{email}</p>
        </div>

        <div className="mb-7 rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md ${
                isSubscribed ? "bg-emerald-500/15 text-emerald-400" : "bg-yellow-500/15 text-yellow-400"
              }`}
            >
              {isSubscribed ? <BellRing className="h-4 w-4" /> : <MailX className="h-4 w-4" />}
            </div>
            <p className="text-sm leading-6 text-gray-300">
              Marketing emails are currently{" "}
              <span className={isSubscribed ? "font-semibold text-emerald-400" : "font-semibold text-yellow-400"}>
                {isSubscribed ? "enabled" : "disabled"}
              </span>
              . You can update this anytime.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => updatePreference("subscribe")}
            disabled={isLoading || isSubscribed}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-4 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MailCheck className="h-4 w-4" />
            Resubscribe
          </button>
          <button
            type="button"
            onClick={() => updatePreference("unsubscribe")}
            disabled={isLoading || !isSubscribed}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-500 bg-gray-800 px-4 text-sm font-semibold text-gray-100 transition-colors hover:border-yellow-400 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MailX className="h-4 w-4" />
            Unsubscribe
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-md border border-gray-700 bg-gray-800/70 px-3 py-2">
            <p className="text-sm text-gray-300">{message}</p>
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-gray-500">
          By managing preferences, you control promotional email delivery. Transactional emails related to account
          security and essential service updates may still be sent.
        </p>

        {isLoading && (
          <p className="mt-3 text-xs font-medium tracking-wide text-yellow-400">Updating preferences...</p>
        )}
      </div>
    </main>
  );
};

export default EmailPreferencesClient;
