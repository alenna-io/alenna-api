import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CacheOptions {
  maxAge?: number;
  staleWhileRevalidate?: number;
  private?: boolean;
  noCache?: boolean;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    maxAge = 120,
    staleWhileRevalidate = 240,
    private: isPrivate = false,
    noCache = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    if (noCache) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return next();
    }

    const cacheControl = isPrivate
      ? `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      : `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

    res.setHeader('Cache-Control', cacheControl);

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      const bodyString = JSON.stringify(body);
      const etag = crypto.createHash('md5').update(bodyString).digest('hex');
      res.setHeader('ETag', `"${etag}"`);

      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === `"${etag}"`) {
        res.status(304).end();
        return res;
      }

      return originalJson(body);
    };

    next();
  };
}

