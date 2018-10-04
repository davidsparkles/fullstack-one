"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getRelationMetasFromDefinition(field) {
    if (field.type.kind === "NamedType") {
        return {
            foreignGqlTypeName: field.type.name.value,
            isNonNullType: false,
            isListType: false
        };
    }
    if (field.type.kind === "NonNullType" && field.type.type.kind === "NamedType") {
        return {
            foreignGqlTypeName: field.type.type.name.value,
            isNonNullType: true,
            isListType: false
        };
    }
    if (field.type.kind === "ListType" && field.type.type.kind === "NonNullType" && field.type.type.type.kind === "NamedType") {
        return {
            foreignGqlTypeName: field.type.type.type.name.value,
            isNonNullType: false,
            isListType: true
        };
    }
    if (field.type.kind === "NonNullType" &&
        field.type.type.kind === "ListType" &&
        field.type.type.type.kind === "NonNullType" &&
        field.type.type.type.type.kind === "NamedType") {
        return {
            foreignGqlTypeName: field.type.type.type.type.name.value,
            isNonNullType: true,
            isListType: true
        };
    }
    throw new Error(`Invalid relation for field: ${JSON.stringify(field, null, 2)}`);
}
exports.getRelationMetasFromDefinition = getRelationMetasFromDefinition;
