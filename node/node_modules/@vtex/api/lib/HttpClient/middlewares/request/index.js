"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buildFullPath_1 = __importDefault(require("axios/lib/core/buildFullPath"));
const qs_1 = require("qs");
const ramda_1 = require("ramda");
const Tags_1 = require("../../../tracing/Tags");
const renameBy_1 = require("../../../utils/renameBy");
const setupAxios_1 = require("./setupAxios");
const http = setupAxios_1.getConfiguredAxios();
const paramsSerializer = (params) => {
    return qs_1.stringify(params, { arrayFormat: 'repeat' });
};
exports.defaultsMiddleware = ({ baseURL, rawHeaders, params, timeout, retries, verbose, exponentialTimeoutCoefficient, initialBackoffDelay, exponentialBackoffCoefficient, httpsAgent }) => {
    const countByMetric = {};
    const headers = renameBy_1.renameBy(ramda_1.toLower, rawHeaders);
    return (ctx, next) => {
        ctx.config = {
            baseURL,
            exponentialBackoffCoefficient,
            exponentialTimeoutCoefficient,
            httpsAgent: ctx.config.httpsAgent || httpsAgent,
            initialBackoffDelay,
            maxRedirects: 0,
            retries,
            timeout,
            validateStatus: status => (status >= 200 && status < 300),
            verbose,
            ...ctx.config,
            headers: {
                ...headers,
                ...renameBy_1.renameBy(ramda_1.toLower, ctx.config.headers),
            },
            params: {
                ...params,
                ...ctx.config.params,
            },
            paramsSerializer,
            retryCount: 0,
        };
        if (ctx.config.verbose && ctx.config.metric) {
            const current = countByMetric[ctx.config.metric];
            countByMetric[ctx.config.metric] = (current || 0) + 1;
            ctx.config.count = countByMetric[ctx.config.metric];
            ctx.config.label = `${ctx.config.metric}#${ctx.config.count}`;
        }
        if (ctx.tracing.isSampled) {
            const { config } = ctx;
            const fullUrl = buildFullPath_1.default(config.baseURL, http.getUri(config));
            ctx.tracing.rootSpan.addTags({
                [Tags_1.OpentracingTags.HTTP_METHOD]: config.method || 'get',
                [Tags_1.OpentracingTags.HTTP_URL]: fullUrl,
            });
        }
        return next();
    };
};
const ROUTER_CACHE_KEY = 'x-router-cache';
const ROUTER_CACHE_HIT = 'HIT';
const ROUTER_CACHE_REVALIDATED = 'REVALIDATED';
exports.routerCacheMiddleware = async (ctx, next) => {
    var _a, _b, _c;
    await next();
    const routerCacheHit = (_b = (_a = ctx.response) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b[ROUTER_CACHE_KEY];
    const status = (_c = ctx.response) === null || _c === void 0 ? void 0 : _c.status;
    if (routerCacheHit) {
        ctx.tracing.rootSpan.setTag("http.cache.router" /* HTTP_ROUTER_CACHE_RESULT */, routerCacheHit);
    }
    if (routerCacheHit === ROUTER_CACHE_HIT || (routerCacheHit === ROUTER_CACHE_REVALIDATED && status !== 304)) {
        ctx.cacheHit = {
            memory: 0,
            revalidated: 0,
            ...ctx.cacheHit,
            router: 1,
        };
    }
};
exports.requestMiddleware = (limit) => async (ctx, next) => {
    const makeRequest = () => http.request(ctx.config);
    ctx.response = await (limit ? limit(makeRequest) : makeRequest());
};
