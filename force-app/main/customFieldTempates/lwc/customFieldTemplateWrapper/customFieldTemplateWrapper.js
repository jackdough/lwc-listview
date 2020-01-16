import { LightningElement, api, track, wire } from 'lwc';
// import displayTemplate from './display.html';
// import editTemplate from './edit.html'

export default class CustomFieldTemplateWrapper extends LightningElement {
    @api rowKeyValue;
    @api colKeyValue;
    @api editable;

    @track editing;
    _editedValue;
    editRendered;

    renderedCallback() {
        const input = this.template.querySelector('input');
        if (this.editing && !this.editRendered && input) {
            input.focus();
            this.editRendered = true;
        }
    }
    handleEditfinished(event) {
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
}