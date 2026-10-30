import { useEffect, useState } from 'react';

import type { NewsItem } from './feed.js';

export type NewsState =
  | { status: 'loading' }
  | { status: 'ready'; items: NewsItem[] }
  | { status: 'unavailable' };

/** Reads the news endpoint; any failure reads as unavailable, never as old or invented stories. */
export function useCryptoNews(): NewsState {
  const [state, setState] = useState<NewsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/crypto-news', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`News endpoint responded ${response.status}`);
        const body = (await response.json()) as { items?: NewsItem[] };
        if (!Array.isArray(body.items) || body.items.length === 0) {
          throw new Error('News endpoint returned no items');
        }
        setState({ status: 'ready', items: body.items });
      })
      .catch((error: Error) => {
        if (error.name === 'AbortError') return;
        setState({ status: 'unavailable' });
      });
    return () => controller.abort();
  }, []);

  return state;
}
