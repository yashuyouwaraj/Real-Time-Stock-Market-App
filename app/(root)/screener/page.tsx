import ScreenerClient from "@/components/ScreenerClient";
import { getScreenerUniverse } from "@/lib/actions/finnhub.actions";

export default async function ScreenerPage() {
  const initialRows = await getScreenerUniverse(40);

  return (
    <div className="watchlist-container">
      <ScreenerClient initialRows={initialRows} />
    </div>
  );
}
