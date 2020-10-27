"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_error_report_1 = require("@vtex/node-error-report");
const __1 = require("..");
const utils_1 = require("../utils");
class ErrorReport extends node_error_report_1.ErrorReportBase {
    /**
     * Create a new ErrorReport wrapping args.originalError
     *
     * In case the args.originalError argument is already an ErrorReport
     * instance, then ErrorReport.create just returns it. If it's not,
     * it returns a new ErrorReport wrapping the error. This way you can
     * use ErrorReport.create on a catchAll, e.g.:
     *
     * ```
     * try {
     *   await next()
     * } catch(err) {
     *   ErrorReport.create({ originalError: err }).injectOnSpan(span)
     * }
     * ```
     *
     * More docs on the ErrorReport available on: https://github.com/vtex/node-error-report
     */
    static create(args) {
        if (args.originalError instanceof ErrorReport) {
            return args.originalError;
        }
        return new ErrorReport(node_error_report_1.createErrorReportBaseArgs(args));
    }
    /**
     * Inject information about the error wrapped by this ErrorReport
     * instance on the provided Span. If a logger is provided and the
     * span is part of a **sampled** trace, then the error will be logged.
     */
    injectOnSpan(span, logger) {
        var _a;
        span.setTag(__1.TracingTags.ERROR, 'true');
        const indexedLogs = {
            ["error.kind" /* ERROR_KIND */]: this.kind,
            ["error.id" /* ERROR_ID */]: this.metadata.errorId,
        };
        if (node_error_report_1.isRequestInfo(this.parsedInfo) &&
            this.parsedInfo.response &&
            node_error_report_1.isInfraErrorData((_a = this.parsedInfo.response) === null || _a === void 0 ? void 0 : _a.data)) {
            indexedLogs["error.server.code" /* ERROR_SERVER_CODE */] = this.parsedInfo.response.data.code;
            indexedLogs["error.server.request_id" /* ERROR_SERVER_REQUEST_ID */] = this.parsedInfo.response.data.requestId;
        }
        const serializableError = this.toObject();
        span.log({ event: 'error', ...indexedLogs, error: serializableError });
        if (logger && this.shouldLogToSplunk(span)) {
            logger.error(serializableError);
            this.markErrorAsReported();
        }
        return this;
    }
    shouldLogToSplunk(span) {
        return !this.isErrorReported() && utils_1.getTraceInfo(span).isSampled;
    }
}
exports.ErrorReport = ErrorReport;
