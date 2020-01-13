import { LightningElement, api, track, wire } from 'lwc';
import displayTemplate from './display.html';
import editTemplate from './edit.html'

export default class DatatablePicklistField extends LightningElement {
    @api value;
    @api options;
    @api editable;


    @track editing;
    editRendered;
    render() {
        return this.editing ? editTemplate : displayTemplate;
    }
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
        this.value = event.detail.value;
        this.editing = false;
    }

    get editClass() {
        return this.editable ? 'editable' : '';
    }



}