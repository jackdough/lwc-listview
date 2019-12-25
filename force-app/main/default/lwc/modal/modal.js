import { LightningElement,api,track } from 'lwc';

export default class Modal extends LightningElement {
    @api headerText;
    @api hideFooter=false;
    @track showModal = false;

    @api open(){
        this.showModal = true;
    }

    @api close(){
        this.showModal = false;
        this.dispatchEvent(new CustomEvent('close'));
    }
}