import { LightningElement, api, track, wire } from 'lwc';
// import displayTemplate from './display.html';
// import editTemplate from './edit.html'

export default class DatatablePicklistField extends LightningElement {
    @api rowKeyValue;
    @api colKeyValue;
    @api value;
    @api 
    get options() {
        return this._options;
    }
    set options(value) {
        this._options = value;
        this.valueToLabelMap = value.reduce((acc,opt) => {
            acc[opt.value] = opt.label;
            return acc;
        }, {});
    }
    @api editable;

    @track editing;
    @track _options;
    valueToLabelMap={};
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
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                value: event.detail.value,
                rowKeyValue: this.rowKeyValue,
                colKeyValue: this.colKeyValue
            },
            bubbles: true,
            composed: true
        }));
        this.editing = false;
        // this.template.focus();
    }

    get editClass() {
        return this.editable ? 'editable ' : '';
    }

    get displayValue() {
        return this.valueToLabelMap[this.value] || this.value;
    }

}