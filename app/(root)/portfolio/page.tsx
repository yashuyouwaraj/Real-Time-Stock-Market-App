import { headers } from "next/headers";
import { redirect } from "next/navigation";
import PortfolioClient from "@/components/PortfolioClient";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { PortfolioPosition } from "@/database/models/portfolio-position.model";

export default async function PortfolioPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  await connectToDatabase();
  const rows = await PortfolioPosition.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();

  const initialPositions = rows.map((row) => ({
    id: String(row._id),
    symbol: String(row.symbol),
    company: String(row.company),
    quantity: Number(row.quantity),
    averageCost: Number(row.averageCost),
  }));

  return (
    <div className="watchlist-container">
      <PortfolioClient initialPositions={initialPositions} />
    </div>
  );
}
