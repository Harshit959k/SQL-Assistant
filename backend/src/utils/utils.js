
const embeddingTemplate = (table, columns, relations) => {
    return `TABLE:
${table}

COLUMNS:
${columns}

${relations ? 'RELATIONS:' : ''}
${relations ? relations : ''}`;
}

export const normalizeMySQLSchema = (conversationId, columns, relations) => {
    const result = [];
    const map = new Map();

    for(let column of columns) {
        if(map.has(column.TABLE_NAME)) {
            map.get(column.TABLE_NAME).columns.push(column);
        } else {
            map.set(column.TABLE_NAME, { columns: [ column ] });
        }
    }

    for(let relation of relations) {
        const tableMappings = map.get(relation.TABLE_NAME);
        if('relations' in tableMappings) {
            tableMappings.relations.push(relation);
        } else {
            tableMappings.relations = [ relation ];
        }
    }

    for(let [ key, value ] of map.entries()) {
        const temp = { tableName: key, conversationId };
        const columns = value.columns;
        const relations = value.relations;
        
        const columnStr = columns.map(column => {
            return `- ${column.COLUMN_NAME} ${column.COLUMN_TYPE} ${column.IS_NULLABLE === 'YES' ? 'NULLABLE' : 'NON-NULLABLE'}`;
        }).join('\n');

        const relationStr = relations?.map(relation => {
            return `- ${relation.TABLE_NAME}.${relation.COLUMN_NAME} -> ${relation.REFERENCED_TABLE_NAME}.${relation.REFERENCED_COLUMN_NAME}`
        }).join('\n');

        const embeddingStr = embeddingTemplate(key, columnStr, relationStr);
        temp.embeddingStr = embeddingStr;
        result.push(temp);
    }

    return result;
}