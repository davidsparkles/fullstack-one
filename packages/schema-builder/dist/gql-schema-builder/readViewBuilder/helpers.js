"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function filterRelevantExpressions(expressionObject) {
    return expressionObject.isRequiredAsPermissionExpression === true && expressionObject.excludeFromPermissionExpressions !== true;
}
function createExpressionSql(expressionObject) {
    if (expressionObject.type === "function") {
        return `${expressionObject.sql} AS "${expressionObject.name}"`;
    }
    if (expressionObject.requiresLateral) {
        return `LATERAL (SELECT ${expressionObject.sql} AS "${expressionObject.name}") AS "${expressionObject.name}"`;
    }
    return `(SELECT ${expressionObject.sql} AS "${expressionObject.name}") AS "${expressionObject.name}"`;
}
function getExpressionName(expressionObject) {
    return `"${expressionObject.name}"`;
}
function createView(table, config, name, fields, expressions, disableSecurityBarrier) {
    const statements = [];
    statements.push(`DROP VIEW IF EXISTS "${config.schemaName}"."${name}";`);
    let sql = `CREATE OR REPLACE VIEW "${config.schemaName}"."${name}"${disableSecurityBarrier === true ? "" : " WITH (security_barrier)"} AS `;
    // TODO: Dustin: Put _local_table_ into constant for all queries
    sql += `SELECT ${fields.join(", ")} FROM "${table.schemaName}"."${table.tableName}" AS "_local_table_"`;
    if (expressions.length > 0) {
        sql += `, ${expressions.map(createExpressionSql).join(", ")}`;
    }
    // We only want to allow a user to see entities if he can access any field
    const conditionExpressions = expressions.filter(filterRelevantExpressions);
    if (conditionExpressions.length > 0) {
        sql += ` WHERE (FALSE OR ${conditionExpressions.map(getExpressionName).join(" OR ")})`;
    }
    else {
        // A view without any expression makes no sense
        return null;
    }
    sql += ";";
    statements.push(sql);
    statements.push(`GRANT SELECT ON "${config.schemaName}"."${name}" TO ${config.userName};`);
    return statements;
}
exports.createView = createView;
function createGqlField(name, gqlReturnType) {
    return {
        kind: "FieldDefinition",
        name: {
            kind: "Name",
            value: name
        },
        arguments: [],
        type: {
            kind: "NamedType",
            name: {
                kind: "Name",
                value: gqlReturnType
            }
        },
        directives: []
    };
}
exports.createGqlField = createGqlField;
