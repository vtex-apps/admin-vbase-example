"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../../../../constants");
const cacheControl_1 = require("../utils/cacheControl");
function setVaryHeaders(ctx, cacheControl) {
    ctx.vary(constants_1.FORWARDED_HOST_HEADER);
    if (cacheControl.scope === 'segment') {
        ctx.vary(constants_1.SEGMENT_HEADER);
    }
    if (cacheControl.scope === 'private' || ctx.query.scope === 'private') {
        ctx.vary(constants_1.SEGMENT_HEADER);
        ctx.vary(constants_1.SESSION_HEADER);
    }
    else if (ctx.vtex.sessionToken) {
        ctx.vtex.logger.warn({
            message: 'GraphQL resolver receiving session token without private scope',
            userAgent: ctx.get('user-agent'),
        });
    }
}
async function response(ctx, next) {
    var _a;
    await next();
    const { cacheControl, status, graphqlResponse, } = ctx.graphql;
    const cacheControlHeader = cacheControl_1.cacheControlHTTP(ctx);
    ctx.set(constants_1.CACHE_CONTROL_HEADER, cacheControlHeader);
    if (status === 'error') {
        // Do not generate etag for errors
        ctx.remove(constants_1.META_HEADER);
        ctx.remove(constants_1.ETAG_HEADER);
        (_a = ctx.vtex.recorder) === null || _a === void 0 ? void 0 : _a.clear();
    }
    if (ctx.method.toUpperCase() === 'GET') {
        setVaryHeaders(ctx, cacheControl);
    }
    ctx.body = graphqlResponse;
}
exports.response = response;
