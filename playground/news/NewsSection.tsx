import { NewsCard } from './NewsCard.js';
import { useCryptoNews } from './useCryptoNews.js';

const HOME_ITEM_COUNT = 3;

/** Crypto News band above the playground docs, with a link to the full `/news` page. */
export function NewsSection() {
  const news = useCryptoNews();

  return (
    <section
      aria-labelledby="crypto-news-heading"
      style={{
        padding: '12px 16px 16px',
        background: '#f7f9fb',
        borderBottom: '1px solid #e3e8ee',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <h2 id="crypto-news-heading" style={{ margin: 0, fontSize: 15, color: '#1d2d3e' }}>
          Crypto News
        </h2>
        <a href="/news" style={{ fontSize: 12, fontWeight: 600, color: '#0b6bcb' }}>
          All news
        </a>
      </div>
      {news.status === 'loading' && (
        <p style={{ margin: 0, fontSize: 13, color: '#5b6b7a' }}>Loading crypto news…</p>
      )}
      {news.status === 'unavailable' && (
        <p role="status" style={{ margin: 0, fontSize: 13, color: '#5b6b7a' }}>
          News unavailable
        </p>
      )}
      {news.status === 'ready' && (
        <div
          style={{
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          }}
        >
          {news.items.slice(0, HOME_ITEM_COUNT).map((item) => (
            <NewsCard key={item.link} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
