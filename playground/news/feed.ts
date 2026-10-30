/**
 * Cointribune RSS, read on the dev server: the browser cannot fetch it directly (no CORS
 * headers), so the feed route parses it here and caches the result for 10 minutes.
 */
export type NewsItem = {
  title: string;
  link: string;
  /** ISO date, or '' when the feed has no usable publish date. */
  publishedAt: string;
  thumbnail?: string;
};

const FEED_URL = 'https://www.cointribune.com/en/feed/';
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

let cached: { expiresAt: number; items: NewsItem[] } | undefined;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  hellip: '…',
  mdash: '—',
  ndash: '–',
};

/** Feed text is rendered as text, never as HTML, so tags and entities are resolved here. */
function plainText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] !== '#') return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
      const value =
        code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function tagText(item: string, tag: string): string {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i').exec(item);
  return match ? plainText(match[1]) : '';
}

/** Only image enclosures count: the feed also carries audio ones. */
function enclosureImage(item: string): string | undefined {
  const tag = /<enclosure[^>]*>/i.exec(item)?.[0];
  if (!tag || !/type="image\//i.test(tag)) return undefined;
  return /\surl="([^"]+)"/i.exec(tag)?.[1];
}

function thumbnailOf(item: string): string | undefined {
  const candidates = [
    /<media:thumbnail[^>]*\surl="([^"]+)"/i.exec(item)?.[1],
    /<media:content[^>]*\surl="([^"]+)"/i.exec(item)?.[1],
    enclosureImage(item),
    /<img[^>]*\ssrc="([^"]+)"/i.exec(item)?.[1],
  ];
  return candidates.find((url) => url !== undefined && /^https?:\/\//i.test(url));
}

export function parseFeed(xml: string): NewsItem[] {
  return (xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []).flatMap((item) => {
    const title = tagText(item, 'title');
    const link = tagText(item, 'link');
    if (!title || !/^https?:\/\//i.test(link)) return [];
    const published = Date.parse(tagText(item, 'pubDate'));
    return [
      {
        title,
        link,
        publishedAt: Number.isNaN(published) ? '' : new Date(published).toISOString(),
        thumbnail: thumbnailOf(item),
      },
    ];
  });
}

export async function fetchCryptoNews(): Promise<NewsItem[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.items;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(FEED_URL, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; RedocPlayground/1.0)',
        accept: 'application/rss+xml, application/xml, text/xml',
      },
    });
    if (!response.ok) throw new Error(`Cointribune feed responded ${response.status}`);

    const items = parseFeed(await response.text());
    if (items.length === 0) throw new Error('Cointribune feed returned no items');

    cached = { expiresAt: Date.now() + CACHE_TTL_MS, items };
    return items;
  } finally {
    clearTimeout(timeout);
  }
}
