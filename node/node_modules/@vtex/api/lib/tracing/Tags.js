"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opentracing_1 = require("opentracing");
exports.OpentracingTags = opentracing_1.Tags;
exports.UserlandTags = {
    ...opentracing_1.Tags,
};
