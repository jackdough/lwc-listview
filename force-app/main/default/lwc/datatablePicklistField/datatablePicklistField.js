import { LightningElement, api, track, wire } from 'lwc';
// import displayTemplate from './display.html';
// import editTemplate from './edit.html'

export default class DatatablePicklistField extends LightningElement {
    @api 
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this.editedValue = value;
    }

    @api 
    get options() {
        return this._options;
    }
    set options(value) {
        this._options = value;
        this.valueToLabelMap.reduce((acc,opt) => {
            acc[opt.value] = opt.label;
            return acc;
        }, {});
    }
    @api editable;

    @track editing;
    @track _value;
    @track editedValue;
    @track _options;
    valueToLabelMap;
    editRendered;
    // render() {
    //     return this.editing ? editTemplate : displayTemplate;
    // }
    renderedCallback() {
        const combobox = this.template.querySelector('lightning-combobox');
        if (!combobox) {
            this.editRendered = false; 
        } else if (!this.editRendered ) {
            combobox.focus();
            this.editRendered = true;
        }
    }
    handleFocusout() {
        this.editing=false;
    }

    handleEdit() {
        this.editing=true;

    }

    handleChange(event) {
        this.editedValue = event.detail.value;
        this.editing = false;
    }

    get editClass() {
        return this.editable ? 'editable ' : '' + 
            this.editedValue === this.value ? '' : 'edited';
    }

    get displayValue() {
        return this.valueToLabelMap[this.editedValue];
    }

}