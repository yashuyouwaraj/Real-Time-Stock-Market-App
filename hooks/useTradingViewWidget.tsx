"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const useTradingViewWidget = (
  scriptUrl: string,
  config: Record<string, unknown>,
  height = 600,
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const configKey = useMemo(() => JSON.stringify(config), [config]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const container = containerRef.current;
    if (!container) return;

    const widgetKey = `${scriptUrl}::${height}::${configKey}`;
    if (container.dataset.loaded === "true" && container.dataset.widgetKey === widgetKey) return;

    container.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.innerHTML = configKey;

    container.appendChild(script);
    container.dataset.loaded = "true";
    container.dataset.widgetKey = widgetKey;

    return () => {
      container.innerHTML = ``;
      delete container.dataset.loaded;
      delete container.dataset.widgetKey;
    };
  }, [configKey, height, isVisible, scriptUrl]);

  return containerRef
};

export default useTradingViewWidget;
