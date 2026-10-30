import { NewsCard } from './NewsCard.js';
import { useCryptoNews } from './useCryptoNews.js';

/** `/news`: every story the feed returns, each linking out to Cointribune. */
export function NewsPage() {
  const news = useCryptoNews();

  return (
    <main
      style={{
        // The playground's global CSS sets `body { min-width: 320px }`; stay inside the viewport.
        boxSizing: 'border-box',
        width: '100vw',
        maxWidth: '100vw',
        minHeight: '100vh',
        padding: 16,
        background: '#f7f9fb',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <a href="/" style={{ fontSize: 13, color: '#0b6bcb' }}>
          ← Back to playground
        </a>
        <h1 style={{ margin: '8px 0 4px', fontSize: 22, color: '#1d2d3e' }}>Crypto News</h1>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#5b6b7a' }}>
          Latest headlines from Cointribune.
        </p>
        {news.status === 'loading' && (
          <p style={{ margin: 0, fontSize: 13, color: '#5b6b7a' }}>Loading crypto news…</p>
        )}
        {news.status === 'unavailable' && (
          <p role="status" style={{ margin: 0, fontSize: 13, color: '#5b6b7a' }}>
            News unavailable
          </p>
        )}
        {news.status === 'ready' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {news.items.map((item) => (
              <NewsCard key={item.link} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
