"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
const RANGE_HEADER_QS_KEY = '__range_header';
const cacheableStatusCodes = [200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501]; // https://tools.ietf.org/html/rfc7231#section-6.1
exports.cacheKey = (config) => {
    const { baseURL = '', url = '', params, headers } = config;
    const locale = headers[constants_1.LOCALE_HEADER];
    const encodedBaseURL = baseURL.replace(/\//g, '\\');
    const encodedURL = url.replace(/\//g, '\\');
    let key = `${locale}--${encodedBaseURL}--${encodedURL}?`;
    if (params) {
        Object.keys(params).sort().forEach(p => key = key.concat(`--${p}=${params[p]}`));
    }
    if (headers === null || headers === void 0 ? void 0 : headers.range) {
        key = key.concat(`--${RANGE_HEADER_QS_KEY}=${headers.range}`);
    }
    return key;
};
const parseCacheHeaders = (headers) => {
    const { 'cache-control': cacheControl = '', etag, age: ageStr } = headers;
    const cacheDirectives = cacheControl.split(',').map(d => d.trim());
    const maxAgeDirective = cacheDirectives.find(d => d.startsWith('max-age'));
    const [, maxAgeStr] = maxAgeDirective ? maxAgeDirective.split('=') : [null, null];
    const maxAge = maxAgeStr ? parseInt(maxAgeStr, 10) : 0;
    const age = ageStr ? parseInt(ageStr, 10) : 0;
    return {
        age,
        etag,
        maxAge,
        noCache: cacheDirectives.indexOf('no-cache') !== -1,
        noStore: cacheDirectives.indexOf('no-store') !== -1,
    };
};
function isLocallyCacheable(arg, type) {
    return arg && !!arg.cacheable
        && (arg.cacheable === type || arg.cacheable === CacheType.Any || type === CacheType.Any);
}
exports.isLocallyCacheable = isLocallyCacheable;
const addNotModified = (validateStatus) => (status) => validateStatus(status) || status === 304;
var CacheType;
(function (CacheType) {
    CacheType[CacheType["None"] = 0] = "None";
    CacheType[CacheType["Memory"] = 1] = "Memory";
    CacheType[CacheType["Disk"] = 2] = "Disk";
    CacheType[CacheType["Any"] = 3] = "Any";
})(CacheType = exports.CacheType || (exports.CacheType = {}));
const CacheTypeNames = {
    [CacheType.None]: 'none',
    [CacheType.Memory]: 'memory',
    [CacheType.Disk]: 'disk',
    [CacheType.Any]: 'any',
};
exports.cacheMiddleware = ({ type, storage }) => {
    const CACHE_RESULT_TAG = type === CacheType.Disk ? "http.cache.disk" /* HTTP_DISK_CACHE_RESULT */ : "http.cache.memory" /* HTTP_MEMORY_CACHE_RESULT */;
    const cacheType = CacheTypeNames[type];
    return async (ctx, next) => {
        if (!isLocallyCacheable(ctx.config, type)) {
            return await next();
        }
        const span = ctx.tracing.rootSpan;
        const key = exports.cacheKey(ctx.config);
        const segmentToken = ctx.config.headers[constants_1.SEGMENT_HEADER];
        const keyWithSegment = key + segmentToken;
        span.log({
            event: "cache-key-created" /* CACHE_KEY_CREATE */,
            ["cache-type" /* CACHE_TYPE */]: cacheType,
            ["key" /* KEY */]: key,
            ["key-with-segment" /* KEY_WITH_SEGMENT */]: keyWithSegment,
        });
        const cacheHasWithSegment = await storage.has(keyWithSegment);
        const cached = cacheHasWithSegment ? await storage.get(keyWithSegment) : await storage.get(key);
        if (cached && cached.response) {
            const { etag: cachedEtag, response, expiration, responseType, responseEncoding } = cached;
            if (type === CacheType.Disk && responseType === 'arraybuffer') {
                response.data = Buffer.from(response.data, responseEncoding);
            }
            const now = Date.now();
            span.log({
                event: "local-cache-hit-info" /* LOCAL_CACHE_HIT_INFO */,
                ["cache-type" /* CACHE_TYPE */]: cacheType,
                ["etag" /* ETAG */]: cachedEtag,
                ["expiration-time" /* EXPIRATION_TIME */]: (expiration - now) / 1000,
                ["response-type" /* RESPONSE_TYPE */]: responseType,
                ["response-encoding" /* RESPONSE_ENCONDING */]: responseEncoding,
            });
            if (expiration > now) {
                ctx.response = response;
                ctx.cacheHit = {
                    memory: 1,
                    revalidated: 0,
                    router: 0,
                };
                span.setTag(CACHE_RESULT_TAG, "HIT" /* HIT */);
                return;
            }
            span.setTag(CACHE_RESULT_TAG, "STALE" /* STALE */);
            const validateStatus = addNotModified(ctx.config.validateStatus);
            if (cachedEtag && validateStatus(response.status)) {
                ctx.config.headers['if-none-match'] = cachedEtag;
                ctx.config.validateStatus = validateStatus;
            }
        }
        else {
            span.setTag(CACHE_RESULT_TAG, "MISS" /* MISS */);
        }
        await next();
        if (!ctx.response) {
            return;
        }
        const revalidated = ctx.response.status === 304;
        if (revalidated && cached) {
            ctx.response = cached.response;
            ctx.cacheHit = {
                memory: 1,
                revalidated: 1,
                router: 0,
            };
        }
        const { data, headers, status } = ctx.response;
        const { age, etag, maxAge: headerMaxAge, noStore, noCache } = parseCacheHeaders(headers);
        const { forceMaxAge } = ctx.config;
        const maxAge = forceMaxAge && cacheableStatusCodes.includes(status) ? Math.max(forceMaxAge, headerMaxAge) : headerMaxAge;
        span.log({
            event: "cache-config" /* CACHE_CONFIG */,
            ["cache-type" /* CACHE_TYPE */]: cacheType,
            ["age" /* AGE */]: age,
            ["calculated-max-age" /* CALCULATED_MAX_AGE */]: maxAge,
            ["max-age" /* MAX_AGE */]: headerMaxAge,
            ["force-max-age" /* FORCE_MAX_AGE */]: forceMaxAge,
            ["etag" /* ETAG */]: etag,
            ["no-cache" /* NO_CACHE */]: noCache,
            ["no-store" /* NO_STORE */]: noStore,
        });
        // Indicates this should NOT be cached and this request will not be considered a miss.
        if (!forceMaxAge && (noStore || (noCache && !etag))) {
            span.log({ event: "no-local-cache-save" /* NO_LOCAL_CACHE_SAVE */, ["cache-type" /* CACHE_TYPE */]: cacheType });
            return;
        }
        const shouldCache = maxAge || etag;
        const varySession = ctx.response.headers.vary && ctx.response.headers.vary.includes(constants_1.SESSION_HEADER);
        if (shouldCache && !varySession) {
            const { responseType, responseEncoding: configResponseEncoding } = ctx.config;
            const currentAge = revalidated ? 0 : age;
            const varySegment = ctx.response.headers.vary && ctx.response.headers.vary.includes(constants_1.SEGMENT_HEADER);
            const setKey = varySegment ? keyWithSegment : key;
            const responseEncoding = configResponseEncoding || (responseType === 'arraybuffer' ? 'base64' : undefined);
            const cacheableData = type === CacheType.Disk && responseType === 'arraybuffer'
                ? data.toString(responseEncoding)
                : data;
            const expiration = Date.now() + (maxAge - currentAge) * 1000;
            await storage.set(setKey, {
                etag,
                expiration,
                response: { data: cacheableData, headers, status },
                responseEncoding,
                responseType,
            });
            span.log({
                event: "local-cache-saved" /* LOCAL_CACHE_SAVED */,
                ["cache-type" /* CACHE_TYPE */]: cacheType,
                ["key-set" /* KEY_SET */]: setKey,
                ["age" /* AGE */]: currentAge,
                ["etag" /* ETAG */]: etag,
                ["expiration-time" /* EXPIRATION_TIME */]: (expiration - Date.now()) / 1000,
                ["response-encoding" /* RESPONSE_ENCONDING */]: responseEncoding,
                ["response-type" /* RESPONSE_TYPE */]: responseType,
            });
            return;
        }
        span.log({ event: "no-local-cache-save" /* NO_LOCAL_CACHE_SAVE */, ["cache-type" /* CACHE_TYPE */]: cacheType });
    };
};
