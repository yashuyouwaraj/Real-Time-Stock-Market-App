import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { AlertRule } from "@/database/models/alert-rule.model";
import AlertsClient from "@/components/AlertsClient";

export default async function AlertsPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  await connectToDatabase();
  const rows = await AlertRule.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();

  const initialAlerts = rows.map((r) => ({
    id: String(r._id),
    symbol: String(r.symbol),
    company: String(r.company),
    ruleType: r.ruleType,
    threshold: Number(r.threshold),
    cooldownMinutes: Number(r.cooldownMinutes || 0),
    quietHoursStart: String(r.quietHoursStart || ""),
    quietHoursEnd: String(r.quietHoursEnd || ""),
    enabled: Boolean(r.enabled),
  }));

  return (
    <div className="watchlist-container">
      <AlertsClient initialAlerts={initialAlerts} />
    </div>
  );
}
