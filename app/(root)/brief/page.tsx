import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/better-auth/auth";
import { getDailyBriefsByUserId } from "@/lib/actions/brief.actions";

export default async function BriefPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const briefs = await getDailyBriefsByUserId(session.user.id);

  return (
    <div className="watchlist-container">
      <section className="watchlist-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-yellow-500/80">AI Digest</p>
          <h1 className="watchlist-title mt-2">Daily Brief</h1>
          <p className="mt-2 text-gray-400">Your personalized morning brief generated from regime + watchlist news.</p>
        </div>
      </section>

      <section className="space-y-4">
        {briefs.map((brief) => (
          <article key={brief.id} className="watchlist-card p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{brief.dateKey}</p>
            <h2 className="text-xl font-semibold text-gray-100 mt-2">{brief.headline}</h2>
            <div
              className="mt-4 text-gray-300 [&_h3]:text-yellow-400 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:mb-3 [&_li]:mb-2"
              dangerouslySetInnerHTML={{ __html: brief.briefHtml }}
            />
          </article>
        ))}
        {briefs.length === 0 && (
          <div className="watchlist-card p-6 text-gray-400">No briefs generated yet. The daily AI run will populate this feed.</div>
        )}
      </section>
    </div>
  );
}
