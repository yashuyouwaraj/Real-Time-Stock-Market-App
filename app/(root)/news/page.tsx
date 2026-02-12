import TradingViewWidget from "@/components/TradingViewWidget";
import NewsFeedClient from "@/components/NewsFeedClient";
import { TOP_STORIES_WIDGET_CONFIG } from "@/lib/constants";
import { getGeneralNewsPage } from "@/lib/actions/finnhub.actions";

export default async function NewsPage() {
  const scriptUrl = "https://s3.tradingview.com/external-embedding/embed-widget-";
  const { items, hasMore } = await getGeneralNewsPage(1, 20);

  return (
    <div className="news-page">
      <section className="news-hero">
        <div>
          <p className="news-kicker">Market Intelligence</p>
          <h1 className="news-hero-title">Live Market News</h1>
          <p className="news-hero-subtitle">
            Real-time stories from global markets with infinite feed updates.
          </p>
        </div>
        <div className="news-hero-stat">
          <span className="news-hero-stat-label">Initial Stories</span>
          <span className="news-hero-stat-value">{items.length}</span>
        </div>
      </section>

      <section>
        <TradingViewWidget
          title="TradingView Live News"
          scriptUrl={`${scriptUrl}timeline.js`}
          config={TOP_STORIES_WIDGET_CONFIG}
          className="custom-chart"
          height={520}
        />
      </section>

      <NewsFeedClient initialItems={items} initialHasMore={hasMore} />
    </div>
  );
}
