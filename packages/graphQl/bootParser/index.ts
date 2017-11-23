import * as _ from 'lodash';

// refDbObjectCurrentTable:
//  - ref to current parent table obj will be passed through all iterations after table was added
// refDbObjectCurrentTableField:
// - ref to current parent table field obj will be passed through all iterations
//   after table field was added
export function parseGraphQlJsonNode(
  gQlSchemaNode,
  dbObjectNode,
  dbObject?,
  refDbObjectCurrentTable?,
  refDbObjectCurrentTableField?,
) {
  // ref to dbObject will be passed through all iterations
  const refDbObj = dbObject || dbObjectNode;

  // dynamic parser loader
  if (gQlSchemaNode == null || gQlSchemaNode.kind == null) {
    // ignore empty nodes or nodes without a kind
  } else if (GQL_JSON_PARSER[gQlSchemaNode.kind] == null) {
    process.stdout.write(
      'parser.error.unknown.type: ' + gQlSchemaNode.kind + '\n',
    );
  } else {
    // parse
    GQL_JSON_PARSER[gQlSchemaNode.kind](
      gQlSchemaNode,
      dbObjectNode,
      refDbObj,
      refDbObjectCurrentTable,
      refDbObjectCurrentTableField,
    );
  }
}

const GQL_JSON_PARSER = {
  // iterate over all type definitions
  Document: (gQlSchemaNode, dbObjectNode, refDbObj) => {
    // FIRST:
    // create blank objects for all tables (needed for validation of relationships)
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      const tableName = gQlJsonSchemaDocumentNode.name.value;
      // create tableObject in dbObject
      refDbObj.tables[tableName] = {
        name: tableName,
        isDbModel: false,
        schemaName: 'public',
      };
    });

    // SECOND:
    // parse all documents recursively
    Object.values(gQlSchemaNode.definitions).map((gQlJsonSchemaDocumentNode) => {
      parseGraphQlJsonNode(gQlJsonSchemaDocumentNode, dbObjectNode, refDbObj);
    });
  },

  // parse Type Definitions
  ObjectTypeDefinition: (gQlSchemaDocumentNode, dbObjectNode, refDbObj) => {
    // get table name from typeDefinition
    const tableName = gQlSchemaDocumentNode.name.value;

    // and save ref to tableObject for recursion
    const refDbObjectCurrentTable = dbObjectNode.tables[tableName];

    // parse ObjectType properties
    Object.values(gQlSchemaDocumentNode).map((gQlSchemaDocumentNodeProperty) => {
      // iterate over sub nodes (e.g. intefaces, fields, directives
      if (Array.isArray(gQlSchemaDocumentNodeProperty)) {
        Object.values(gQlSchemaDocumentNodeProperty).map((gQlSchemaDocumentSubnode) => {
            // parse sub node
            parseGraphQlJsonNode(
              gQlSchemaDocumentSubnode,
              refDbObjectCurrentTable,
              refDbObj,
              refDbObjectCurrentTable,
            );
          },
        );
      }
    });
  },

  // parse FieldDefinition Definitions
  FieldDefinition: (
    gQlFieldDefinitionNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
  ) => {
    // create fields object if not set already
    dbObjectNode.fields = dbObjectNode.fields || [];

    const newField = {
      constraints: {
        isPrimaryKey: false,
        nullable: true,
        unique: false,
      },
    };
    // add new field ref to dbObject
    // newField will now update data in the dbObject through this ref
    dbObjectNode.fields.push(newField);

    // check if field is relation
    if (
      _.get(gQlFieldDefinitionNode, 'directives[0].name.value') === 'relation'
    ) {
      // handle relation
      relationBuilderHelper(
        gQlFieldDefinitionNode,
        dbObjectNode,
        refDbObj,
        refDbObjectCurrentTable,
        newField,
      );
    } else {
      // handle normal field

      // parse FieldDefinition properties
      Object.values(gQlFieldDefinitionNode).map((gQlSchemaFieldNodeProperty) => {
        if (
          typeof gQlSchemaFieldNodeProperty === 'object' &&
          !Array.isArray(gQlSchemaFieldNodeProperty)
        ) {
          // object

          // parse sub node
          parseGraphQlJsonNode(
            gQlSchemaFieldNodeProperty,
            newField,
            refDbObj,
            refDbObjectCurrentTable,
            newField,
          );
        } else if (
          typeof gQlSchemaFieldNodeProperty === 'object' &&
          !!Array.isArray(gQlSchemaFieldNodeProperty)
        ) {
          // array

          // iterate over sub nodes (e.g. arguments, directives
          Object.values(gQlSchemaFieldNodeProperty).map((gQlSchemaFieldSubnode) => {
              // parse sub node
              parseGraphQlJsonNode(
                gQlSchemaFieldSubnode,
                newField,
                refDbObj,
                refDbObjectCurrentTable,
                newField,
              );
            },
          );
        }
      });
    }
  },

  // parse Name kind
  Name: (
    gQlSchemaNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableField,
  ) => {
    // todo one to many relationships are nested
    if (gQlSchemaNode != null && dbObjectNode != null) {
      // set field name
      dbObjectNode.name = gQlSchemaNode.value;
    }
  },

  // parse NamedType kind
  NamedType: (
    gQlSchemaNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableField,
  ) => {
    const fieldType = gQlSchemaNode.name.value;
    let dbType = 'varchar';
    switch (fieldType) {
      case 'ID':
        dbType = 'uuid';
        dbObjectNode.constraints.isPrimaryKey = true;
        break;
      case 'String':
        dbType = 'varchar';
        break;
      default:
        // unknown type
        process.stdout.write(
          'parser.error.unknown.field.type: ' + fieldType + '\n',
        );
        break;
    }

    // set field name
    dbObjectNode.type = dbType;
  },

  // parse NonNullType kind
  NonNullType: (
    gQlSchemaNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableField,
  ) => {
    // set NOT NULL restriction
    dbObjectNode.constraints.nullable = false;

    // parse sub type
    if (gQlSchemaNode.type != null) {
      const gQlSchemaTypeNode = gQlSchemaNode.type;
      parseGraphQlJsonNode(
        gQlSchemaTypeNode,
        dbObjectNode,
        refDbObj,
        refDbObjectCurrentTable,
        refDbObjectCurrentTableField,
      );
    }
  },

  // set list type
  ListType: (
    gQlSchemaTypeNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableField,
  ) => {
    dbObjectNode.type = 'jsonb';
    dbObjectNode.defaultValue = {};
  },

  // parse Directive
  Directive: (
    gQlDirectiveNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableField,
  ) => {
    const directiveKind = gQlDirectiveNode.name.value;
    switch (directiveKind) {
      case 'table':
        dbObjectNode.isDbModel = true;
        break;
      case 'isUnique':
        dbObjectNode.constraints.unique = true;
        break;
      case 'computed':
        dbObjectNode.type = 'computed';
        break;
      case 'relation':
        // mark field as relation
        // relation directive was handled already in the FieldDefinition handler
        dbObjectNode.type = 'relation';
        break;
      default:
        process.stdout.write(
          'parser.error.unknown.directive.kind: ' + directiveKind + '\n',
        );
        break;
    }
  },

  // parse Argument
  Argument: (
    gQlNode,
    dbObjectNode,
    refDbObj,
    refDbObjectCurrentTable,
    refDbObjectCurrentTableField,
  ) => {
    // set argument name and value
    // todo one to many relationships are nested
    if (gQlNode != null && dbObjectNode != null) {
      dbObjectNode[gQlNode.name.value] = gQlNode.value.value;
    }
  },
};

function relationBuilderHelper(
  gQlDirectiveNode,
  dbObjectNode,
  refDbObj,
  refDbObjectCurrentTable,
  refDbObjectCurrentTableField,
) {
  const relationName = _.get(
    gQlDirectiveNode,
    'directives[0].arguments[0].value.value',
  );
  const schemaName = 'public';
  const referencedSchemaName = 'public';
  const tableName = refDbObjectCurrentTable.name;
  const fieldName = _.get(gQlDirectiveNode, 'name.value');
  const fieldType = _.get(gQlDirectiveNode, 'directives[0].name.value');
  let referencedTableName = _.get(gQlDirectiveNode, 'type');

  const relationType = ((node) => {
    if (node.type.kind === 'NamedType') {
      referencedTableName = _.get(gQlDirectiveNode, 'type.name.value');
      return 'ONE';
    } else if (
      node.type.kind === 'NonNullType' &&
      node.type.type.kind === 'NamedType'
    ) {
      referencedTableName = _.get(gQlDirectiveNode, 'type.type.name.value');
      return 'ONE';
    } else if (
      node.type.kind === 'NonNullType' &&
      node.type.type.kind === 'ListType' &&
      node.type.type.type.kind === 'NonNullType' &&
      node.type.type.type.type.kind === 'NamedType'
    ) {
      referencedTableName = _.get(
        gQlDirectiveNode,
        'type.type.type.type.name.value',
      );
      return 'MANY';
    }
  })(gQlDirectiveNode);

  // create relation in dbObject if ont set yet
  // and save ref for later
  const relationsArray = (refDbObj.relations[relationName] =
    refDbObj.relations[relationName] || []);

  // create relation
  const relation = {
    schemaName,
    tableName,
    fieldName,
    name: relationName,
    type: relationType,
    // joins to
    reference: {
      fieldName,
      schemaName: referencedSchemaName,
      tableName: referencedTableName,
    },
  };

  relationsArray.push(relation);
}