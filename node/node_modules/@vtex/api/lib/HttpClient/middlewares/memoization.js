"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("./cache");
exports.memoizationMiddleware = ({ memoizedCache }) => {
    return async (ctx, next) => {
        if (!cache_1.isLocallyCacheable(ctx.config, cache_1.CacheType.Any) || !ctx.config.memoizable) {
            return next();
        }
        const span = ctx.tracing.rootSpan;
        const key = cache_1.cacheKey(ctx.config);
        const isMemoized = !!memoizedCache.has(key);
        span.log({ event: "cache-key-created" /* CACHE_KEY_CREATE */, ["cache-type" /* CACHE_TYPE */]: 'memoization', ["key" /* KEY */]: key });
        if (isMemoized) {
            span.setTag("http.cache.memoization" /* HTTP_MEMOIZATION_CACHE_RESULT */, "HIT" /* HIT */);
            const memoized = await memoizedCache.get(key);
            ctx.memoizedHit = isMemoized;
            ctx.response = memoized.response;
            return;
        }
        else {
            span.setTag("http.cache.memoization" /* HTTP_MEMOIZATION_CACHE_RESULT */, "MISS" /* MISS */);
            const promise = new Promise(async (resolve, reject) => {
                try {
                    await next();
                    resolve({
                        cacheHit: ctx.cacheHit,
                        response: ctx.response,
                    });
                    span.log({ event: "memoization-cache-saved" /* MEMOIZATION_CACHE_SAVED */, ["key-set" /* KEY_SET */]: key });
                }
                catch (err) {
                    reject(err);
                    span.log({ event: "memoization-cache-saved-error" /* MEMOIZATION_CACHE_SAVED_ERROR */, ["key-set" /* KEY_SET */]: key });
                }
            });
            memoizedCache.set(key, promise);
            await promise;
        }
    };
};
