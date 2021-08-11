# datatable
## Description
Takes as input an sObject and an array of fields and populates a datatable with records from the database.

### Fields: 

    {
        fieldName (required),,
        editFieldName (name of field to save when editing),
        label (defaults to field label),
        searchable (defaults to true on text fields),
        sortable (defaults to true),
        visible (defaults to true),
        editable (defaults to table setting),
        options (array of options for picklist - Array of strings or objects with `label` and `value`)
    }

Notes one `editFieldName`: This is designed for use with a calculated (formula) field that fronts field in Salesforce. Use carefully! It may not be obvious to users that they are editing a different field. Additionally, all the metadata comes from the original field - not the edit field! So make sure that they are the same type.


#### Example:
    
    [
        {
            "fieldName": "Name"
        },
        {
            "fieldName": "Phone",
            "sortable": false,
            "editable": true
        },
        {
            "fieldName": "Account.Website",
            "label": "Website"
        }
    ]

### Row Actions:
Contains a label and a callback that does something with the selected row. The callback should take an input of a row object and return a promise. If the return value is `false` the row will be deleted from the datatable, otherwise the row will be updated with return value of the promise (if there is one).

    {
        label,
        callback
    }


## Properties
Name | Type |Read only | Required | Description | Default value
---|---|---|---|---|---
`s-object`|string||✔| name of Salesforce object
`fields`|array||✔|fields to display. Optionally a comma separated list of fields
`sorted-by`|string||✔|field to sort table by
`sorted-direction`|string|||`asc` or `desc`|`asc`
`editable`|boolean|||make the entire table editable (by default). this can also be set on the field level|`false`
`filter`|string|||string to filter by - excluding the where clause. e.g. `Name='Bob' AND Total_Donations__c > 1000`
`search`|string|||text to search in all searchable text fields
`row-actions`|array or function|||array of row actions to display on each row. optionally a function which takes as input the rwo of the datable and returns an array of row actions
`hide-checkbox-column`|boolean|||hide checkboxes from table (disable row selection)
`enable-infinite-loading`|boolean|||automatically load more records when user reaches the end of the datatable|`false`
`records-per-batch`|integer|||number of records to load when the end of the datable is reached|`50`
`initial-records`|integer|||number of records to load initially|`this.recordsPerBatch`
`enableLiveUpdates`|boolean|||update records using PushTopic|`false`
`selected-rows`|array|✔||array of selected IDs from datatable
`query`|string|✔||generated query string used to retrieve data
`record-count`|integer|✔||total number of records returned by current query

## Methods
Name | Parameters | Return |  Description 
---|---|---|---
`refresh`|||refresh the data in the datatable using the current fields and filters
`clearSelection`|||clear all selected rows

## Events
Name|Detail|Bubbles
---|---|---
`rowselection`| `{ selectedRows }`
`loaddata`| `{ recordCount, sortedDirection, sortedBy }`