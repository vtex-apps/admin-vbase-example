"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RequestCancelledError_1 = require("../../errors/RequestCancelledError");
const requestStats_1 = require("../../service/worker/runtime/http/middlewares/requestStats");
const utils_1 = require("../../utils");
const retry_1 = require("../../utils/retry");
const status_1 = require("../../utils/status");
exports.metricsMiddleware = ({ metrics, serverTiming, name }) => {
    const serverTimingStart = process.hrtime();
    const serverTimingLabel = utils_1.shrinkTimings(utils_1.formatTimingName({
        hopNumber: 0,
        source: process.env.VTEX_APP_NAME,
        target: name || 'unknown',
    }));
    return async (ctx, next) => {
        const start = process.hrtime();
        let status = 'unknown';
        let errorCode;
        let errorStatus;
        try {
            if (ctx.config.verbose && ctx.config.label) {
                console.log(`VERBOSE: ${name}.${ctx.config.label}`, `start`);
            }
            await next();
            if (ctx.config.metric && ctx.response && ctx.response.status) {
                status = status_1.statusLabel(ctx.response.status);
            }
        }
        catch (err) {
            const isCancelled = (err.message === requestStats_1.cancelMessage);
            if (ctx.config.metric) {
                errorCode = err.code;
                errorStatus = err.response && err.response.status;
                if (err.code === 'ECONNABORTED') {
                    status = 'aborted';
                }
                else if (err.response && err.response.data && err.response.data.code === retry_1.TIMEOUT_CODE) {
                    status = 'timeout';
                }
                else if (err.response && err.response.status) {
                    status = status_1.statusLabel(err.response.status);
                }
                else if (isCancelled) {
                    status = 'cancelled';
                }
                else {
                    status = 'error';
                }
            }
            throw isCancelled
                ? new RequestCancelledError_1.RequestCancelledError(err.message)
                : err;
        }
        finally {
            if (ctx.config.metric && metrics) {
                const label = `http-client-${ctx.config.metric}`;
                const extensions = {};
                Object.assign(extensions, { [status]: 1 });
                if (ctx.cacheHit) {
                    Object.assign(extensions, ctx.cacheHit, { [`${status}-hit`]: 1 });
                }
                else if (!ctx.inflightHit && !ctx.memoizedHit) {
                    // Lets us know how many calls passed through to origin
                    Object.assign(extensions, { [`${status}-miss`]: 1 });
                }
                if (ctx.inflightHit) {
                    Object.assign(extensions, { [`${status}-inflight`]: 1 });
                }
                if (ctx.memoizedHit) {
                    Object.assign(extensions, { [`${status}-memoized`]: 1 });
                }
                if (ctx.config.retryCount) {
                    const retryCount = ctx.config.retryCount;
                    if (retryCount > 0) {
                        extensions[`retry-${status}-${retryCount}`] = 1;
                    }
                }
                const end = status === 'success' && !ctx.cacheHit && !ctx.inflightHit && !ctx.memoizedHit
                    ? process.hrtime(start)
                    : undefined;
                metrics.batch(label, end, extensions);
                if (ctx.config.verbose) {
                    console.log(`VERBOSE: ${name}.${ctx.config.label}`, {
                        ...extensions,
                        ...errorCode || errorStatus ? { errorCode, errorStatus } : null,
                        millis: end
                            ? utils_1.hrToMillis(end)
                            : extensions.revalidated || extensions.router || status !== 'success'
                                ? utils_1.hrToMillis(process.hrtime(start))
                                : '(from cache)',
                        status: ctx.response && ctx.response.status,
                        headers: ctx.response && ctx.response.headers,
                    });
                }
            }
            else {
                if (ctx.config.verbose) {
                    console.warn(`PROTIP: Please add a metric property to ${name} client request to get metrics in Splunk`, { baseURL: ctx.config.baseURL, url: ctx.config.url });
                }
            }
            if (serverTiming) {
                // Timings in the client's perspective
                const dur = utils_1.hrToMillis(process.hrtime(serverTimingStart));
                if (!serverTiming[serverTimingLabel] || Number(serverTiming[serverTimingLabel]) < dur) {
                    serverTiming[serverTimingLabel] = `${dur}`;
                }
            }
        }
    };
};
