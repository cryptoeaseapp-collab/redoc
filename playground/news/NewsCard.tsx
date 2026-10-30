import type { NewsItem } from './feed.js';

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

/** One feed story: headline, date, thumbnail and a link out. Feed text is rendered as text only. */
export function NewsCard({ item }: { item: NewsItem }) {
  const date = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString(undefined, DATE_FORMAT)
    : '';

  return (
    <article
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        minWidth: 0,
        background: '#fff',
        border: '1px solid #e3e8ee',
        borderRadius: 6,
      }}
    >
      {item.thumbnail && (
        <img
          src={item.thumbnail}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            flex: '0 0 auto',
            width: 72,
            height: 72,
            objectFit: 'cover',
            borderRadius: 4,
            background: '#eef2f6',
          }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.35, color: '#1d2d3e' }}>
          {item.title}
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#5b6b7a' }}>
          {date && `${date} · `}
          Source: Cointribune
        </p>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 600, color: '#0b6bcb' }}
        >
          Read on Cointribune
        </a>
      </div>
    </article>
  );
}
