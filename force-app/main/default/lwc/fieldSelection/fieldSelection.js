import { LightningElement, api, track } from 'lwc';

export default class FieldSelection extends LightningElement {
    constructor(){
        super();
        // we use this to keep track of the order of the fields
        this._updatedSelectedFields = [];
    }        
    @track _availableFields;
    @track selectedfields = [];
    @track nonselectedfields = [];
    @track _showWarning = false;

    connectedCallback(){
        let parsedAvailableFields = JSON.parse(JSON.stringify(this.availablefields));
        // private for this function
        const _selectedFields = [];
        
        const allItems = parsedAvailableFields.map(field => {
            let selected = Object.values(field)[0].selected;
            let visible = Object.values(field)[0].visible;
            let key = Object.keys(field)[0];
            if (selected && visible) {
                _selectedFields.push(key);
            }
            return {value: key, label: key};
        });
        this.nonselectedfields.push(...allItems);   
        this.selectedfields.push(..._selectedFields);
        this._updatedSelectedFields = this.selectedfields.map(field => field);
    }

    @api 
    set availablefields(values){
        this._availableFields = values;
    }

    get availablefields(){
        return this._availableFields;
    }

    dispatchFieldsToParent(){
        const updatedAvailableFields = {selectedFields: [], nonSelectedFields: []};
        const selectedMap = {};
        let parsedAvailableFields = JSON.parse(JSON.stringify(this.availablefields));

        for (let i = 0; i < this._updatedSelectedFields.length; i++) {
            updatedAvailableFields.selectedFields.push(this._updatedSelectedFields[i]);
            selectedMap[this._updatedSelectedFields[i]] = 1;
        }
        // add all remaning non selected fields to the nonSelectedFields
        for (let i = 0; i < parsedAvailableFields.length; i++){
            let fieldObj = parsedAvailableFields[i];
            let fieldKey = Object.keys(fieldObj)[0];
            if (!(selectedMap.hasOwnProperty(fieldKey))) {
                updatedAvailableFields.nonSelectedFields.push(fieldKey);
            }
        }

        if (updatedAvailableFields.selectedFields.length < 1) {
            this._showWarning = true;
            return;
        }

        this.dispatchEvent(new CustomEvent('updatedfieldsselection', {detail: updatedAvailableFields}));
    }

    closeModal(){
        this.dispatchEvent(new CustomEvent('closemodal'));
    }

    handleChange(event){
        this._updatedSelectedFields = event.detail.value.map(field => {
            return field; 
        });

        if (this._showWarning && this._updatedSelectedFields.length > 0) {
            this._showWarning = false;
        }
    }
}