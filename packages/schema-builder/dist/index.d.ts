import { DbSchemaBuilder } from './db-schema-builder';
export { IViews, IExpressions, IDbMeta, IDbRelation };
import * as utils from './gql-schema-builder/utils';
export { utils };
import { IViews, IExpressions } from './gql-schema-builder/interfaces';
import { IDbMeta, IDbRelation } from './db-schema-builder/IDbMeta';
export { splitActionFromNode } from './db-schema-builder/helper';
export { createConstraint } from './db-schema-builder/fromGQl/gQlAstToDbMetaHelper';
export { registerDirectiveParser } from './db-schema-builder/fromGQl/gQlAstToDbMeta';
export { registerQueryParser } from './db-schema-builder/fromPg/pgToDbMeta';
export { registerTriggerParser } from './db-schema-builder/fromPg/pgToDbMeta';
export { registerColumnMigrationExtension, registerTableMigrationExtension } from './db-schema-builder/toPg/createSqlObjFromMigrationObject';
export declare class SchemaBuilder {
    private graphQlConfig;
    private gQlSdl;
    private gQlSdlExtensions;
    private gQlAst;
    private views;
    private expressions;
    private gQlRuntimeDocument;
    private dbSchemaBuilder;
    private pgToDbMeta;
    private gQlRuntimeSchema;
    private gQlTypes;
    private dbMeta;
    private mutations;
    private queries;
    private customOperations;
    private parsers;
    private logger;
    private ENVIRONMENT;
    constructor(loggerFactory?: any, config?: any, bootLoader?: any, dbSchemaBuilder?: any, pgToDbMeta?: any);
    getDbSchemaBuilder(): DbSchemaBuilder;
    getPgDbMeta(): Promise<IDbMeta>;
    addParser(parser: any): void;
    getDbMeta(): any;
    extendSchema(schema: string): void;
    getGQlRuntimeObject(): {
        dbMeta: any;
        views: IViews;
        expressions: IExpressions;
        gQlRuntimeDocument: any;
        gQlRuntimeSchema: string;
        gQlTypes: any;
        mutations: any;
        queries: any;
        customOperations: any;
    };
    getGQlSdl(): any;
    getGQlAst(): any;
    private boot();
}