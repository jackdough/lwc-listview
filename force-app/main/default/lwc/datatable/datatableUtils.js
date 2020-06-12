const addFieldMetadata = (columns, fieldOptions) => {
    return JSON.parse(JSON.stringify(columns))
        .map(col => {
            let fieldName = col.fieldName;
            if (fieldName.endsWith('Link')) { // special case for salesforce relationship fields (this will not work for custom relationships)
                fieldName = fieldName.replace('_Link', '.Name');
                fieldName = fieldName.replace('Link', 'Name')
            }
            let field = fieldOptions.find(f => (f.fieldName === fieldName));
            if (field) { // copy values from fields list to columns list
                // col.sortable = field.sortable;
                // col.visible = field.visible;
                // col.editable = field.editable;
                // col.label = field.label || col.label;
                Object.assign(col,field);
                col.typeAttributes = col.typeAttributes || {};
                col.typeAttributes.editable = field.editable;
                col.typeAttributes.options = field.options || col.options || [];
            }
            return col;
        })
        .filter(col => col.visible);
};

const addObjectInfo = (columns, objectInfo) => {
    return columns.map(col => {
        let fieldName = col.fieldName;
        if (!fieldName) {
            return col;
        }
        if (fieldName.endsWith('Link')) { // special case for salesforce relationship fields (this will not work for custom relationships)
            fieldName = fieldName.replace('_Link', '.Name');
            fieldName = fieldName.replace('Link', 'Name')
        }
        let fieldInfo = objectInfo && objectInfo.fields && objectInfo.fields[fieldName];
        if (fieldInfo) {
            col.sortable = fieldInfo.sortable && col.sortable; // field is not sortable if 
        }
        return col;
    });
}

const addRowActions = (columns, rowActions) => {
    if (rowActions && rowActions.length || typeof rowActions === 'function') {
        columns.push({
            type: 'action',
            typeAttributes: {
            rowActions: rowActions
            }
        });
    }
    return columns;
};

const getNumberOfRecordsToLoad = (numberOfLoadedRecords, recordsPerBatch, maxRecords) => {
    if ((recordsPerBatch + numberOfLoadedRecords) <= maxRecords) {
        return recordsPerBatch;
    } 
    return maxRecords - numberOfLoadedRecords;
}

const createFieldArrayFromString = (value) => {
    let fields;
    if (value.substring(0,1)==='[')  {
        fields = JSON.parse(value);
    } else {
        fields = value.split(',')
            .map(field => {
            return {
                fieldName: field.trim()
            };
            });
    }
    return fields;
}

const addDefaultFieldValues = (fields, editable) => {
    return fields.map(field => {
        if (!field.fieldName) throw new Error('Field must have a valid `fieldName` property');

        if (typeof field.visible === 'undefined')
            field.visible = true; // default true
        else
            field.visible = !!field.visible; // convert to boolean

        if (typeof field.sortable === 'undefined')
            field.sortable = true; // default true
        else
            field.sortable = !!field.sortable; // convert to boolean

        if (typeof field.editable === 'undefined') {
            field.editable = (
          !!field.editFieldName || // if editFieldName is set, assume field is editable
          field.fieldName === 'StageName' ||
          !field.fieldName.endsWith('Name') // &&
          // !field.fieldName.endsWith('Link') &&
          // !field.fieldName.endsWith('Id')
          ) && editable; // default to global setting
        } else  {
            field.editable = !!field.editable; // convert to boolean
        }

        if (field.options && 
            Array.isArray(field.options) && 
            field.options.every(opt=> typeof opt === 'string')) {

          field.options = field.options.map(opt => {return {label: opt, value: opt}});
          
        }
        return field;
      });
}

export {
    addFieldMetadata,
    addObjectInfo,
    addRowActions,
    getNumberOfRecordsToLoad,
    createFieldArrayFromString,
    addDefaultFieldValues
};