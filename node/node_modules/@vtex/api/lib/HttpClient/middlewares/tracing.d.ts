import { MiddlewaresTracingContext, RequestConfig } from '..';
import { IOContext } from '../../service/worker/runtime/typings';
import { MiddlewareContext } from '../typings';
interface HttpClientTracingMiddlewareConfig {
    clientName: string;
    tracer: IOContext['tracer'];
    logger: IOContext['logger'];
    hasMemoryCacheMiddleware: boolean;
    hasDiskCacheMiddleware: boolean;
}
export interface TraceableRequestConfig extends RequestConfig {
    tracing: MiddlewaresTracingContext;
}
export declare const createHttpClientTracingMiddleware: ({ tracer, logger, clientName, hasMemoryCacheMiddleware, hasDiskCacheMiddleware, }: HttpClientTracingMiddlewareConfig) => (ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void>;
export {};
