import CompareClient from "@/components/CompareClient";
import { getComparisonSnapshot } from "@/lib/actions/finnhub.actions";

export default async function ComparePage() {
  const initialRows = await getComparisonSnapshot(["AAPL", "MSFT", "NVDA"]);

  return (
    <div className="watchlist-container">
      <CompareClient initialRows={initialRows} />
    </div>
  );
}
