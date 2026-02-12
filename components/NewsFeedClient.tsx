"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatTimeAgo } from "@/lib/utils";
import { ArrowUpRight, Clock3 } from "lucide-react";

const PAGE_SIZE = 20;

const NewsFeedClient = ({ initialItems, initialHasMore }: { initialItems: MarketNewsArticle[]; initialHasMore: boolean }) => {
  const [items, setItems] = useState<MarketNewsArticle[]>(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const seenUrls = useMemo(() => new Set(items.map((i) => i.url)), [items]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/news?page=${nextPage}&limit=${PAGE_SIZE}`);
      if (!res.ok) {
        throw new Error("Failed to fetch more news");
      }

      const data = (await res.json()) as { items: MarketNewsArticle[]; hasMore: boolean };
      const deduped = (data.items || []).filter((item) => !seenUrls.has(item.url));
      setItems((prev) => [...prev, ...deduped]);
      setPage(nextPage);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error("loadMore news error:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, seenUrls]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "500px 0px", threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return <p className="text-gray-400">No latest news available right now.</p>;
  }

  return (
    <section className="space-y-5">
      <div className="news-feed-header">
        <h2 className="news-feed-title">Latest News Feed</h2>
        <p className="news-feed-subtitle">{items.length} stories loaded</p>
      </div>

      <div className="news-feed-grid">
        {items.map((article) => (
          <article key={`${article.id}-${article.url}`} className="news-card">
            <div className="news-card-top">
              <span className="news-source-badge">{article.source}</span>
              <p className="news-time">
                <Clock3 className="h-3.5 w-3.5" />
                {formatTimeAgo(article.datetime)}
              </p>
            </div>

            <h3 className="news-card-title">{article.headline}</h3>
            <p className="news-card-summary">{article.summary}</p>

            <Link href={article.url} target="_blank" rel="noopener noreferrer" className="news-card-cta">
              Read full story
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} className="news-feed-status">
        {loading ? "Loading more stories..." : hasMore ? "Scroll to load more" : "You are up to date"}
      </div>
    </section>
  );
};

export default NewsFeedClient;
