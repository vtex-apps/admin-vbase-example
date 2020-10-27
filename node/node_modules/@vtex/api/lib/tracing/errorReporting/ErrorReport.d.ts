import { ErrorReportBase, ErrorReportCreateArgs } from '@vtex/node-error-report';
import { Span } from 'opentracing';
import { IOContext } from '../../service/worker/runtime/typings';
export declare class ErrorReport extends ErrorReportBase {
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
    static create(args: ErrorReportCreateArgs): ErrorReport;
    /**
     * Inject information about the error wrapped by this ErrorReport
     * instance on the provided Span. If a logger is provided and the
     * span is part of a **sampled** trace, then the error will be logged.
     */
    injectOnSpan(span: Span, logger?: IOContext['logger']): this;
    private shouldLogToSplunk;
}
