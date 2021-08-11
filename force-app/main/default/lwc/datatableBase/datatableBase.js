import LightningDatatable from 'lightning/datatable';
import picklistField from './picklistField.html';

export default class DatatableBase extends LightningDatatable {
    static customTypes = {
        picklist: {
            template: picklistField,
            standardCellLayout: false,
            typeAttributes: ['options','editable']
        }
    }
}