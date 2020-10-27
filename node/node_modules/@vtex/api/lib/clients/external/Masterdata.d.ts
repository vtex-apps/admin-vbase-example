import { InstanceOptions, IOContext, RequestTracingConfig } from '../..';
import { ExternalClient } from './ExternalClient';
export declare class MasterData extends ExternalClient {
    constructor(ctx: IOContext, options?: InstanceOptions);
    getSchema<T>({ dataEntity, schema }: GetSchemaInput, tracingConfig?: RequestTracingConfig): Promise<T>;
    createOrUpdateSchema<T>({ dataEntity, schemaName, schemaBody }: CreateSchemaInput, tracingConfig?: RequestTracingConfig): Promise<T>;
    getPublicSchema<T>({ dataEntity, schema }: GetSchemaInput, tracingConfig?: RequestTracingConfig): Promise<T>;
    getDocument<T>({ dataEntity, id, fields }: GetDocumentInput, tracingConfig?: RequestTracingConfig): Promise<T>;
    createDocument({ dataEntity, fields, schema }: CreateDocumentInput, tracingConfig?: RequestTracingConfig): Promise<DocumentResponse>;
    createOrUpdateEntireDocument({ dataEntity, fields, id, schema }: CreateOrUpdateInput, tracingConfig?: RequestTracingConfig): Promise<DocumentResponse>;
    createOrUpdatePartialDocument({ dataEntity, fields, id, schema }: CreateOrUpdateInput, tracingConfig?: RequestTracingConfig): Promise<DocumentResponse>;
    updateEntireDocument({ dataEntity, id, fields, schema }: UpdateInput, tracingConfig?: RequestTracingConfig): Promise<void>;
    updatePartialDocument({ dataEntity, id, fields, schema }: UpdateInput, tracingConfig?: RequestTracingConfig): Promise<void>;
    searchDocuments<T>({ dataEntity, fields, where, pagination, schema, sort }: SearchInput, tracingConfig?: RequestTracingConfig): Promise<T[]>;
    scrollDocuments<T>({ dataEntity, fields, mdToken, schema, size, sort, }: ScrollInput, tracingConfig?: RequestTracingConfig): Promise<{
        mdToken: string;
        data: ScrollResponse<T>;
    }>;
    deleteDocument({ dataEntity, id }: DeleteInput, tracingConfig?: RequestTracingConfig): Promise<import("../..").IOResponse<void>>;
}
interface PaginationArgs {
    page: number;
    pageSize: number;
}
interface DocumentResponse {
    Id: string;
    Href: string;
    DocumentId: string;
}
interface GetSchemaInput {
    dataEntity: string;
    schema: string;
}
interface CreateSchemaInput {
    dataEntity: string;
    schemaName: string;
    schemaBody: object;
}
interface GetDocumentInput {
    dataEntity: string;
    id: string;
    fields: string[];
}
interface CreateDocumentInput {
    dataEntity: string;
    fields: object;
    schema?: string;
}
interface CreateOrUpdateInput {
    dataEntity: string;
    fields: object;
    id?: string;
    schema?: string;
}
interface UpdateInput {
    dataEntity: string;
    id: string;
    fields: object;
    schema?: string;
}
interface SearchInput {
    dataEntity: string;
    fields: string[];
    where?: string;
    pagination: PaginationArgs;
    schema?: string;
    sort?: string;
}
interface ScrollInput {
    dataEntity: string;
    fields: string[];
    schema?: string;
    sort?: string;
    size?: number;
    mdToken?: string;
}
interface DeleteInput {
    dataEntity: string;
    id: string;
}
interface ScrollResponse<T> {
    data: T[];
    mdToken: string;
}
export {};
