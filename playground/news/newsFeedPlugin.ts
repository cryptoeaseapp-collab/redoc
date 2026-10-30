import type { Plugin } from 'vite';

import { fetchCryptoNews } from './feed.ts';

const ROUTE = '/api/crypto-news';

/**
 * Serves the Cointribune feed to the playground as JSON. It lives on the dev server because the
 * feed sends no CORS headers, and it is cached for 10 minutes so the feed is hit at most that often.
 */
export function newsFeedPlugin(): Plugin {
  return {
    name: 'playground-news-feed',
    configureServer(server) {
      server.middlewares.use(ROUTE, (_request, response) => {
        void fetchCryptoNews()
          .then((items) => {
            response.setHeader('content-type', 'application/json; charset=utf-8');
            response.setHeader('cache-control', 'no-store');
            response.end(JSON.stringify({ items }));
          })
          .catch((error: Error) => {
            server.config.logger.warn(`[news] ${error.message}`);
            response.statusCode = 502;
            response.setHeader('content-type', 'application/json; charset=utf-8');
            response.end(JSON.stringify({ error: 'News unavailable' }));
          });
      });
    },
  };
}
