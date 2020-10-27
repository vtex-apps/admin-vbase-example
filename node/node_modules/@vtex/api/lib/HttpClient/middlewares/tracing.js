"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tracing_1 = require("../../tracing");
const Tags_1 = require("../../tracing/Tags");
const cache_1 = require("./cache");
exports.createHttpClientTracingMiddleware = ({ tracer, logger, clientName, hasMemoryCacheMiddleware, hasDiskCacheMiddleware, }) => {
    return async function tracingMiddleware(ctx, next) {
        const { rootSpan, requestSpanNameSuffix, referenceType = tracing_1.SpanReferenceTypes.CHILD_OF } = ctx.config.tracing || {};
        const spanName = requestSpanNameSuffix ? `request:${requestSpanNameSuffix}` : 'request';
        const span = rootSpan
            ? tracer.startSpan(spanName, {
                references: [tracing_1.createSpanReference(rootSpan, referenceType)],
            })
            : tracer.startSpan(spanName);
        ctx.tracing = {
            ...ctx.config.tracing,
            isSampled: tracing_1.getTraceInfo(span).isSampled,
            logger,
            rootSpan: span,
            tracer,
        };
        ctx.config.tracing = ctx.tracing;
        const hasMemoCache = !(!cache_1.isLocallyCacheable(ctx.config, cache_1.CacheType.Any) || !ctx.config.memoizable);
        const hasMemoryCache = hasMemoryCacheMiddleware && !!cache_1.isLocallyCacheable(ctx.config, cache_1.CacheType.Memory);
        const hasDiskCache = hasDiskCacheMiddleware && !!cache_1.isLocallyCacheable(ctx.config, cache_1.CacheType.Disk);
        span.addTags({
            ["http.cache.memoization.enabled" /* HTTP_MEMOIZATION_CACHE_ENABLED */]: hasMemoCache,
            ["http.cache.memory.enabled" /* HTTP_MEMORY_CACHE_ENABLED */]: hasMemoryCache,
            ["http.cache.disk.enabled" /* HTTP_DISK_CACHE_ENABLED */]: hasDiskCache,
            ["http.client.name" /* HTTP_CLIENT_NAME */]: clientName,
        });
        let response;
        try {
            await next();
            response = ctx.response;
        }
        catch (err) {
            response = err.response;
            if (ctx.tracing.isSampled) {
                tracing_1.ErrorReport.create({ originalError: err }).injectOnSpan(span, logger);
            }
            throw err;
        }
        finally {
            if (response) {
                span.setTag(Tags_1.OpentracingTags.HTTP_STATUS_CODE, response.status);
            }
            else {
                span.setTag("http.no_response" /* HTTP_NO_RESPONSE */, true);
            }
            span.finish();
        }
    };
};
