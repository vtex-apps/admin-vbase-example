"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
const tracing_1 = require("../../../../../../tracing");
const SpanReferenceTypes_1 = require("../../../../../../tracing/spanReference/SpanReferenceTypes");
const spanSetup_1 = require("./spanSetup");
exports.requestSpanPrefix = 'http-request';
const preRequestInterceptor = (http) => (config) => {
    if (!config.tracing || !config.tracing.isSampled) {
        return config;
    }
    const { tracer, rootSpan, requestSpanNameSuffix } = config.tracing;
    const spanName = requestSpanNameSuffix ? `${exports.requestSpanPrefix}:${requestSpanNameSuffix}` : exports.requestSpanPrefix;
    const span = rootSpan
        ? tracer.startSpan(spanName, {
            references: [tracing_1.createSpanReference(rootSpan, SpanReferenceTypes_1.SpanReferenceTypes.CHILD_OF)],
        })
        : tracer.startSpan(spanName);
    spanSetup_1.injectRequestInfoOnSpan(span, http, config);
    config.tracing.requestSpan = span;
    tracer.inject(span, opentracing_1.FORMAT_HTTP_HEADERS, config.headers);
    return config;
};
const onResponseSuccess = (response) => {
    if (!response.config.tracing || !response.config.tracing.isSampled) {
        return response;
    }
    const requestSpan = response.config.tracing.requestSpan;
    spanSetup_1.injectResponseInfoOnSpan(requestSpan, response);
    requestSpan.finish();
    return response;
};
const onResponseError = (err) => {
    var _a, _b;
    if (!((_b = (_a = err === null || err === void 0 ? void 0 : err.config) === null || _a === void 0 ? void 0 : _a.tracing) === null || _b === void 0 ? void 0 : _b.requestSpan) || !err.config.tracing.isSampled) {
        return Promise.reject(err);
    }
    const { requestSpan } = err.config.tracing;
    spanSetup_1.injectResponseInfoOnSpan(requestSpan, err.response);
    tracing_1.ErrorReport.create({ originalError: err }).injectOnSpan(requestSpan, err.config.tracing.logger);
    requestSpan.finish();
    return Promise.reject(err);
};
exports.addTracingPreRequestInterceptor = (http) => {
    const requestTracingInterceptor = http.interceptors.request.use(preRequestInterceptor(http), undefined);
    return { requestTracingInterceptor };
};
exports.addTracingResponseInterceptor = (http) => {
    const responseTracingInterceptor = http.interceptors.response.use(onResponseSuccess, onResponseError);
    return { responseTracingInterceptor };
};
