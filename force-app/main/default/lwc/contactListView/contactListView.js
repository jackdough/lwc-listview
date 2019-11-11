import { LightningElement, track, wire } from 'lwc';

export default class ContactListView extends LightningElement {
    // should be populated with the default fields by their API name 
    defaultFields = ['Name','Email','Gender__c','Age__c'];
    // these are fields that will always be in the query but if removed from columns set to visible = false
    requiredFields = ['Email', 'Age']; // MUST BE FIELD LABEL
    orderBy = 'Name';
    sortDirection = 'asc';
    sObject = 'Contact';
    
    handleRow(row){
        console.log('handling row: ' + row);
    }

    filterRowActions(row, availableActions) {
        const actionsToRemove = {};
        const actionsToReturn = [];
        // Add conditions here for which actions to remove
        // DUMMY EXAMPLES FOR NOW
        if (row['Gender__c'] === 'Male'){
            actionsToRemove['Is Female'] = 1;
        } else if (row['Gender__c'] === 'Female'){
            actionsToRemove['Is Male'] = 1;    
        }

        // return all actions that are not in actionsToRemove
        // must be in a standard loop because when you parse it removes the callback function
        for (let i = 0; i < availableActions.length; i++){
            if (!actionsToRemove.hasOwnProperty(availableActions[i].label)){
                actionsToReturn.push(availableActions[i]);
            }
        }
        return actionsToReturn;
    }

    massActions = '[{"label": "New", "value": "new-record"}, {"label": "Export As CSV", "value": "export"}]';
    rowActions = {availableActions: [{label: 'Show Details', callback: this.handleRow}, {label: 'Is Male', callback: this.handleRow}, {label: 'Is Female', callback: this.handleRow}], filterRowActions: this.filterRowActions};
}