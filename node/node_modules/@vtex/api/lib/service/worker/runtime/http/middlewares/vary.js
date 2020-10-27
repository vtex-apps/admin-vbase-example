"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../../../../constants");
const cachingStrategies = [
    {
        forbidden: [],
        path: '/_v/private/',
        vary: [constants_1.SEGMENT_HEADER, constants_1.SESSION_HEADER],
    },
    {
        forbidden: [constants_1.SEGMENT_HEADER, constants_1.SESSION_HEADER],
        path: '/_v/public/',
        vary: [],
    },
    {
        forbidden: [constants_1.SESSION_HEADER],
        path: '/_v/segment/',
        vary: [constants_1.SEGMENT_HEADER],
    },
];
const shouldVaryByHeader = (ctx, header, strategy) => {
    if (strategy && strategy.vary.includes(header)) {
        return true;
    }
    if (process.env.DETERMINISTIC_VARY) {
        return false;
    }
    return !!ctx.get(header);
};
async function vary(ctx, next) {
    const { method, path } = ctx;
    const strategy = cachingStrategies.find((cachingStrategy) => path.indexOf(cachingStrategy.path) === 0);
    if (strategy) {
        strategy.forbidden.forEach((headerName) => {
            delete ctx.headers[headerName];
        });
    }
    // We don't need to vary non GET requests, since they are never cached
    if (method.toUpperCase() !== 'GET') {
        await next();
        return;
    }
    ctx.vary(constants_1.LOCALE_HEADER);
    if (shouldVaryByHeader(ctx, constants_1.SEGMENT_HEADER, strategy)) {
        ctx.vary(constants_1.SEGMENT_HEADER);
    }
    if (shouldVaryByHeader(ctx, constants_1.SESSION_HEADER, strategy)) {
        ctx.vary(constants_1.SESSION_HEADER);
    }
    await next();
}
exports.vary = vary;
