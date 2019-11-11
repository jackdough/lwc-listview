import { LightningElement, track, api } from 'lwc';

export default class massActions extends LightningElement {
    constructor() {
        super();
        this._availableActions = [];
        this._dropDownActions = [];
        this._showButtonDropdown = false;
    }

    @api massActions;
    @api sobject;
    @api recordFields; // used to create

    @track showModal = false;
    @track actionType;
    @track actionButtonText;
    @track showCreateForm;

    connectedCallback(){
        // format action button
        let ID = 1;
        JSON.parse(this.massActions).forEach(action => {
            this._availableActions.push(
                {
                     id: (action.label + "-" + ID++),
                     value: action.value.trim().toLowerCase(),
                     label: action.label.trim()
                }
            ); 
         });

        if (this._availableActions.length > 3) {
            this._showButtonDropdown = true;
            this._dropDownActions = this._availableActions.slice(3);
            this._availableActions = this._availableActions.slice(0,3);
        }
        this.recordFields = this.recordFields.map(fieldObj => fieldObj.fieldName);
    }
    
    closeModal(){
        // dispatchEvent
        this.actionType = '';
        this.actionButtonText = '';
        this.showModal = false;
    }
  
    openModal(){
        this.showModal = true;
    }

    handleAction(event){
        console.log('on submit');
    }

    handleMassActionButton(event){
        this.actionType = event.target.value;
        this.actionButtonText = event.target.label;

        switch (this.actionType) {
            case 'export':
                this.dispatchCustomEvent('export', 'export');
                break;
            case 'new-record':
                this.showCreateForm = true;
                this.openModal();
                break;
            default:
                this.showCreateForm = false;
                break;
        }
    }

    handleFormSuccess(event){
        debugger;
    }

    dispatchCustomEvent(eventName, payload){
        this.dispatchEvent(new CustomEvent('massactionevent', {detail: {
            eventName: eventName,
            payload: payload
        }}));
    }
}