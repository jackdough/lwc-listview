import { LightningElement, api, track, wire } from 'lwc';
// import displayTemplate from './display.html';
// import editTemplate from './edit.html'

export default class DatatablePicklistField extends LightningElement {
    @api rowKeyValue;
    @api colKeyValue;
    @api 
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = val;
        this._editedValue = val;
    }
    @api 
    get options() {
        return this._options;
    }
    set options(value) {
        if (!Array.isArray(value)) {
            throw new Error('Picklist options must be an array');
        }
        this._options = value;
        this.valueToLabelMap = value.reduce((acc,opt) => {
            acc[opt.value] = opt.label;
            return acc;
        }, {});
    }
    @api editable;

    @track editing;
    @track _options;
    _editedValue;
    valueToLabelMap={};
    editRendered;

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
        if (this._editedValue !== this._value) {
            this.dispatchEvent(new CustomEvent('inlineedit', {
                detail: {
                    value: this._editedValue,
                    rowKeyValue: this.rowKeyValue,
                    colKeyValue: this.colKeyValue
                },
                bubbles: true,
                composed: true
            }));
        }
        this.editing=false;
    }

    handleEdit() {
        this.editing=true;

    }

    handleChange(event) {
        this._editedValue = event.detail.value;
        // this.template.focus();
    }

    get editClass() {
        return this.editable ? 'editable ' : '';
    }

    get displayValue() {
        return this.valueToLabelMap[this.value] || this.value;
    }

}