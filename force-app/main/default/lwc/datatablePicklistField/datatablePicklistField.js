import { LightningElement, api, track, wire } from 'lwc';
// import displayTemplate from './display.html';
// import editTemplate from './edit.html'

export default class DatatablePicklistField extends LightningElement {
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
    @api value;
    @api typeAttributes;
    @track _options;
    valueToLabelMap={};


    get displayValue() {
        return this.valueToLabelMap[this.value] || this.value;
    }
    handleChange(event) {
        this.template.querySelector('lightning-combobox').focus();
    }

}