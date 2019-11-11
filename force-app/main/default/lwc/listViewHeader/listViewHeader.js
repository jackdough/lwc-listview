import { LightningElement, track, api } from 'lwc';

export default class ListViewHeader extends LightningElement {
    constructor(){
        super();
        this._queryTerm = "";
        this._defaultFieldsMap = {};
    }

    @track _fieldsForSelection = [];
    @track showFilters = false;
    @track iconName;
    @track showfieldselection = false;
    // parent component will keep track of the Api name for the title of a field
    // availableFields will be passed to a child field selector component, and will be updated
    // when an event is triggered
    @track _availableFields;
    @track _numberOfRecords;
    @track _orderBy;
    @track _filteredFields;
    @track _iconSectionText;
    @track _selectedRowsCount = 0;

    @api objectName;
    @api massActions;
    

    @api
    get filteredFields(){
        return (this._filteredFields ? this._filteredFields.replace(/%/g, '') : null);
    }

    set filteredFields(value){
        this._filteredFields = value;
    }

    @api 
    set selectedRowsCount(value){
        this._selectedRowsCount = value;
    }

    get selectedRowsCount(){
        return (!this._selectedRowsCount ? 'No Rows Selected' : this._selectedRowsCount + ' Rows Selected');
    }

    @api
    get orderBy(){
        return this._orderBy;
    }

    set orderBy(value){
        this._orderBy = value;
    }

    @api 
    get numberOfRecords(){
        return this._numberOfRecords;
    }

    set numberOfRecords(value){
        this._numberOfRecords = value;
    }

    get iconSectionText(){
        return this.numberOfRecords + " items " + 
        (this.orderBy ? "• Ordered By " + this.orderBy : '') + 
        (this.filteredFields ? " • Filtered By - " + this.filteredFields : '');   
    }

    set iconSectionText(value){
        this._iconSectionText = value;
    }

    handleRefresh(){
        this.dispatchCustomEvent('refresh-datatable', 'refresh-datatable'); // dispatch event that refreshes datatable
    }

    connectedCallback(){
        // remove 's' or 'ies' or __c
        const objectLength = this.objectName.length;
        if (this.objectName.slice(objectLength - 3) === 'ies') {
            this.iconName = "standard:" + (this.objectName.slice(0, objectLength - 3) + 'y').toLowerCase();
        } else if (this.objectName.slice(-1) === "s") {
            this.iconName = "standard:" + this.objectName.slice(0, -1).toLowerCase();
        } else {
            this.iconName = "standard:" + this.objectName.replace('__c', '').toLowerCase();
        }

        // format fields to display
        this.initializeFields();
    }

    @api
    get availableFields(){
        return this._availableFields;
    }

    set availableFields(values){
        this._availableFields = values;
        this.initializeFields();
    }

    // This initializes fields so that the field selector knows which ones to show as selected
    initializeFields(){
        this._fieldsForSelection = this.availableFields.map(field => {
            return { [field.label]: { selected: field.selected, visible: field.visible }};
        });
    }

    handleSearch(event){
        const pressedEnter = (event.keyCode === 13);
        if (pressedEnter) {
            this._queryTerm = event.target.value;
            this.dispatchCustomEvent('search', {detail: this._queryTerm});
        } else if ((!event.target.value.trim().length) && this._queryTerm.length) { // handle if the clear button was clicked
            this._queryTerm = "";
            this.dispatchCustomEvent('search', { detail: "" });    
        }
    }

    handleMassActionsEvent(event){
        this.dispatchCustomEvent(event.detail.eventName, event.detail.payload);
    }

    handleFieldsUpdate(event){
        // send to parent updated fields. Parent needs to then parse and update available fields and defaultFieldsToShow based on selectedFields 
        // event.detail = {selectedFields: Array(), nonSelectedFields: Array()}
        this.dispatchCustomEvent('update-fields', {detail: event.detail});
        this.showfieldselection = false;
    }

    handleOptions(event){
        const selectedOption = event.detail.value;

        switch (selectedOption) {
            case "fields-to-display":
                // open fieldSelectionComponent
                this.showfieldselection = true;
                break;
            case "export":
                this.dispatchCustomEvent('export', 'export');
                break;
            default:
                // set all non selected values to false
                this.showfieldselection = false;
        }
    }

    showFilterOption(){
        this.showFilters = !this.showFilters;
        this.dispatchCustomEvent('show-filters', this.showFilters);
    }

    toggleFieldsSelectionComponent(event){
        this.showfieldselection = !this.showfieldselection;
    }

    dispatchCustomEvent(eventName, eventParams){
        this.dispatchEvent(new CustomEvent('listviewheaderevent', {
            detail: {
                eventName: eventName,
                payload: eventParams
            }
        })
        );
    }
}