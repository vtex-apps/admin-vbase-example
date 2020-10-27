"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const ExternalClient_1 = require("./ExternalClient");
const routes = {
    document: (dataEntity, id) => `${dataEntity}/documents/${id}`,
    documents: (dataEntity) => `${dataEntity}/documents`,
    publicSchema: (dataEntity, schema) => `${dataEntity}/schemas/${schema}/public`,
    schema: (dataEntity, schema) => `${dataEntity}/schemas/${schema}`,
    scroll: (dataEntity) => `${dataEntity}/scroll`,
    search: (dataEntity) => `${dataEntity}/search`,
};
class MasterData extends ExternalClient_1.ExternalClient {
    constructor(ctx, options) {
        super(`http://api.vtex.com/api/dataentities`, ctx, {
            ...options,
            headers: {
                Accept: 'application/json',
                VtexIdclientAutCookie: ctx.authToken,
                'x-vtex-api-appService': ctx.userAgent,
                ...options === null || options === void 0 ? void 0 : options.headers,
            },
            params: {
                an: ctx.account,
                ...options === null || options === void 0 ? void 0 : options.params,
            },
        });
    }
    getSchema({ dataEntity, schema }, tracingConfig) {
        const metric = 'masterdata-getSchema';
        return this.http.get(routes.schema(dataEntity, schema), {
            metric,
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    createOrUpdateSchema({ dataEntity, schemaName, schemaBody }, tracingConfig) {
        const metric = 'masterdata-createOrUpdateSchema';
        return this.http.put(routes.schema(dataEntity, schemaName), schemaBody, {
            metric,
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    getPublicSchema({ dataEntity, schema }, tracingConfig) {
        const metric = 'masterdata-getPublicSchema';
        return this.http.get(routes.publicSchema(dataEntity, schema), {
            metric,
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    getDocument({ dataEntity, id, fields }, tracingConfig) {
        const metric = 'masterdata-getDocument';
        return this.http.get(routes.document(dataEntity, id), {
            metric,
            params: {
                _fields: generateFieldsArg(fields),
            },
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    createDocument({ dataEntity, fields, schema }, tracingConfig) {
        const metric = 'masterdata-createDocument';
        return this.http.post(routes.documents(dataEntity), fields, {
            metric,
            params: {
                _schema: schema,
            },
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    createOrUpdateEntireDocument({ dataEntity, fields, id, schema }, tracingConfig) {
        const metric = 'masterdata-createOrUpdateEntireDocument';
        return this.http.put(routes.documents(dataEntity), { id, ...fields }, {
            metric,
            params: {
                _schema: schema,
            },
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    createOrUpdatePartialDocument({ dataEntity, fields, id, schema }, tracingConfig) {
        const metric = 'masterdata-createOrUpdatePartialDocument';
        return this.http.patch(routes.documents(dataEntity), { id, ...fields }, {
            metric,
            params: {
                _schema: schema,
            },
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    updateEntireDocument({ dataEntity, id, fields, schema }, tracingConfig) {
        const metric = 'masterdata-updateEntireDocument';
        return this.http.put(routes.document(dataEntity, id), fields, {
            metric,
            params: {
                _schema: schema,
            },
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    updatePartialDocument({ dataEntity, id, fields, schema }, tracingConfig) {
        const metric = 'masterdata-updatePartialDocument';
        return this.http.patch(routes.document(dataEntity, id), fields, {
            metric,
            params: {
                _schema: schema,
            },
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    searchDocuments({ dataEntity, fields, where, pagination, schema, sort }, tracingConfig) {
        const metric = 'masterdata-searchDocuments';
        return this.http.get(routes.search(dataEntity), {
            headers: paginationArgsToHeaders(pagination),
            metric,
            params: {
                _fields: generateFieldsArg(fields),
                _schema: schema,
                _sort: sort,
                _where: where,
            },
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
    scrollDocuments({ dataEntity, fields, mdToken, schema, size, sort, }, tracingConfig) {
        const metric = 'masterdata-scrollDocuments';
        return this.http.getRaw(routes.scroll(dataEntity), {
            metric,
            params: {
                _fields: generateFieldsArg(fields),
                _schema: schema,
                _size: size,
                _sort: sort,
                _token: mdToken,
            },
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        }).then(({ headers: { 'x-vtex-md-token': resToken }, data }) => ({ mdToken: resToken, data }));
    }
    deleteDocument({ dataEntity, id }, tracingConfig) {
        const metric = 'masterdata-deleteDocument';
        return this.http.delete(routes.document(dataEntity, id), {
            metric,
            tracing: {
                requestSpanNameSuffix: metric,
                ...tracingConfig === null || tracingConfig === void 0 ? void 0 : tracingConfig.tracing,
            },
        });
    }
}
exports.MasterData = MasterData;
function paginationArgsToHeaders({ page, pageSize }) {
    if (page < 1) {
        throw new __1.UserInputError('Smallest page value is 1');
    }
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
        'REST-Range': `resources=${startIndex}-${endIndex}`,
    };
}
function generateFieldsArg(fields) {
    return fields.join(',');
}
