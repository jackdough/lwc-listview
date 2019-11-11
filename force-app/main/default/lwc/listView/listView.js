import { LightningElement, api, track, wire } from 'lwc';
import ListViewHelpers from '@salesforce/resourceUrl/ListViewHelpers';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import runQuery from '@salesforce/apex/LWCUtils.runQuery';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

export default class listView extends LightningElement {
    constructor(){
        super();
        this.ExportToCsv = null
        this._fieldsMapByLabel = {};
    }

    @api sObject;
    @api massActions;
    @api rowActions;
    @api defaultFields = [];
    @api requiredFields = [];
    @api sortDirection;

    @track _numberOfRecords;
    @track _filterBy;
    @track _orderBy;
    @track pageLogo;
    @track _dataTableFields = [];
    @track _formatedColumns = [];
    @track _loading = true;
    @track _orderBy;
    @track _fields = [];
    @track _doneLoading = false;
    @track _showFilters = false;
    @track _selectedRowsCount;

    @wire(getObjectInfo, { objectApiName: '$sObject' })
    wiredObjectInfo({ error, data }) {
        this.loading = true;
        let result = [];
        if (data) {
            for (let fieldKey in data.fields) {
                if (Object.prototype.hasOwnProperty.call(data.fields, fieldKey)) {
                    let fieldObj = JSON.parse(JSON.stringify(data.fields[fieldKey]));
                    fieldObj.selected = this.defaultFields.includes(fieldObj.apiName);
                    fieldObj.sorted = this.orderBy === fieldObj.apiName;
                    fieldObj.visible = (this.defaultFields.includes(fieldObj.apiName) || this.requiredFields.includes(fieldObj.label))
                    fieldObj.fieldName = fieldObj.apiName;
                    result.push(fieldObj);
                }
            }
            this._fields = result;
            this.setUpFields();
            this.loading = false;
            this._doneLoading  = true;
        } else if (error) {
            this.error(error.statusText + ': ' + error.body.message);
        }
    }

    connectedCallback(){
         Promise.all([
          loadScript(this, ListViewHelpers + '/lwcCcvExport.js')
         ])
         .then(() =>{
            this.ExportToCsv =  window.ExportToCsv;
         }).catch(err => {
            this.error(JSON.stringify(err));
         });
         // Do validation on public properties
         this.validatePublicProperties();
    }

    handleRowAction(event){
        debugger;
    }

    get dataTableFields() {
        return this._dataTableFields;
    }

    set dataTableFields(values){
        // make sure required fields are always in this list
        let fieldsMap = {};
        const fieldsToAdd = [];

        for (let i = 0; i < values.length; i++) {
            fieldsMap[values[i].apiName] = 1;
        }

        for (let i = 0; i < this.requiredFields.length; i++) {
            if (!fieldsMap.hasOwnProperty(this._fieldsMapByLabel[this.requiredFields[i]].apiName)) {
                fieldsToAdd.push(this._fieldsMapByLabel[this.requiredFields[i]]);
            }
        }
        this._dataTableFields = values.concat(fieldsToAdd);
    }

    set loading(value){
        this._loading = value;
    }

    get loading(){
        return this._loading;
    }

    @api
    set orderBy(value) {
        this._orderBy = value
    }

    get orderBy(){
        return this._orderBy;
    }

     
    get showFilters() {
        if (this._showFilters) {
            return 'slds-grid is-expanded';
        }
        return 'slds-grid';
    }
    
    set showFilters(value){
        this._showFilters = value;
    }

    validatePublicProperties(){
        if (typeof(this.massActions) !== "undefined" && !Array.isArray(JSON.parse(this.massActions))) {
            this.error('Action buttons needs to be an array');
        }

        if (this.sObject == null || !this.sObject.length || typeof this.sObject !== 'string') {
            this.error('You must provide an SObject');
        }
    }

    error(err) {
        const evt = new ShowToastEvent({
            title: err.name + ' - ' + err.message,
            message: err.stack,
            variant: 'error',
            mode: 'sticky'
        });
        this.dispatchEvent(evt);
        throw new Error(err);
    }

    setUpFields(){
        let dataTableFieldsArr = [];
        // create private fields map by the fields label
        for (let i = 0; i < this._fields.length; i++) {
            let field = this._fields[i];
            this._fieldsMapByLabel[field.label] = field;
            // set the default fields for the datatable
            if (field.selected) {
                dataTableFieldsArr.push(field);
            }
        }
        // clone the array
        this.dataTableFields = dataTableFieldsArr.slice(0);
    }

    async handleExportAction(){
        let event;
        let soql = this.template.querySelector('c-datatable').query;
        if (!soql) return;
        try {
            let runFunction = new this.ExportToCsv(soql, runQuery);
            await runFunction.Run();
        } catch (e) {
            event = new ShowToastEvent({
                title: 'Error Exporting CSV',
                message: 'There was an error exporting your data: ' + JSON.stringify(e),
                variant: 'error'
            });
            this.dispatchEvent(event);
        }
    }

    get filterBy(){
        return this._filterBy;
    }

    set filterBy(value){
        this._filterBy = value;
    }

    handleUpdateFields(updatedFields){
        this.loading = true;
        const selectedFieldsMap = {};
        const selectedFields = updatedFields.detail.selectedFields;
        // const updatedDataTableFields = [];

        for (let i = 0; i < selectedFields.length; i++) {
            let field = selectedFields[i];
            selectedFieldsMap[field] = 1;
        }

        for (let i = 0; i < Object.keys(this._fieldsMapByLabel).length; i++){
            let key = Object.keys(this._fieldsMapByLabel)[i];
            // DEEP COPY
            let copiedField = JSON.parse(JSON.stringify(this._fieldsMapByLabel[key]))
            if (selectedFieldsMap.hasOwnProperty(key)) {
                copiedField.selected = true;
                copiedField.visible = true;
                // updatedDataTableFields.push(this._fieldsMapByLabel[key]);
            } else {
                // if we are dealing with a required field, set its visiblity to false
                if (this.requiredFields.includes(copiedField.label)) {
                    copiedField.selected = true;
                    copiedField.visible = false;
                } else {
                    copiedField.selected = false;
                }
            }

            this._fieldsMapByLabel[key] = copiedField;
        }

        // sort the fields being passed to the datatable so that match the order of the selected fields

        let listViewHeader = this.template.querySelector('c-list-view-header');
        // this.dataTableFields = updatedDataTableFields.slice(0);
        this.dataTableFields = selectedFields.map(field => {
            return this._fieldsMapByLabel[field];
        });

        listViewHeader.availableFields = Object.values(this._fieldsMapByLabel);

        let dataTable = this.template.querySelector('c-datatable');
        dataTable.fields = this.dataTableFields;
        this.loading = false;
    }

    handleLoadData(event){
        this._numberOfRecords = event.detail.recordCount;
        this.orderBy = event.detail.sortedBy;
    }

    handleRowSelection(event){
        this._selectedRowsCount = Object.keys(event.detail.selectedRows).length;
    }

    handleChildrenEvents(event){
        let dataTable = this.template.querySelector('c-datatable');
        switch (event.detail.eventName) {
            case "export":
                this.handleExportAction();
                break;
            case "update-fields":
                this.handleUpdateFields(event.detail.payload);
                break;
            case "show-filters":
                this.showFilters = event.detail.payload;
                break;
            case "search":
                dataTable.search = event.detail.payload.detail;
                break;
            case 'update-loading':
                this.loading = event.detail.payload;
                break;
            case 'refresh-datatable':
                dataTable.refresh();
                break;
            case 'row-action':
                this.dispatchEvent(new CustomEvent('rowaction', { detail: event.detail.payload }))
            default:
                break;
        }
    }
}
