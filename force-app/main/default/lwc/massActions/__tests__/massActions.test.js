import { createElement } from 'lwc';
import massActions from 'c/massActions';

describe('c-mass-actions', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    const setUp = () => {
        // Create list view element
        const element = createElement('c-mass-actions', {
            is: massActions
        });

        element.recordType = 'Contact';
        element.recordFields = [
            { fieldName: 'Id', label: 'Id', selected: true },
            { fieldName: 'Name', label: 'Name', sortable: true, sorted: true, sortDirection: 'asc', selected: true },
            { fieldName: 'Account.Name', label: 'AccountName', sortable: true, selected: true },
            { fieldName: 'Age__c', label: 'Age', sortable: true, selected: false },
            { fieldName: 'Email__c', label: 'Email', sortable: false, selected: false }
        ];
        element.massActions = '[{"label": "Export As CSV", "value": "export"}]';
        element.actionButtons = '[{"label": "Create", "value": "new-record"}, {"label": "Edit", "value": "edit-record"}, {"label": "temp1", "value": "temp1"}]';
        return element;
    }

    it('successfully open modal and closes', () => {
        let massActionsComponent = setUp();
        document.body.appendChild(massActionsComponent);
        let button;
        let buttons = massActionsComponent.shadowRoot.querySelectorAll('lightning-button');
        for (let i = 0; i < buttons.length; i++) {
            if (buttons[i].label === 'temp1') {
                button = buttons[i];
            }
        }

        let event = new window.Event('click');

        return Promise.resolve().then(() => {
            button.dispatchEvent(event);
        }).then(() => {
            let modalElement = massActionsComponent.shadowRoot.querySelector('.slds-modal__container');
            expect(modalElement).not.toBeNull();

            buttons = massActionsComponent.shadowRoot.querySelectorAll('lightning-button');
            let closeButton;
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].label === 'Close') {
                    closeButton = buttons[i];
                    break;
                }
            }
            closeButton.dispatchEvent(new window.Event('click'));
        }).then(() => {
            let modalElement = massActionsComponent.shadowRoot.querySelector('.slds-modal__container');
            expect(modalElement).toBeNull();
        });
    });

    it('successfully handles mass actions', () => {
        let massActionsComponent = setUp();
        document.body.appendChild(massActionsComponent);
        let mockFn = jest.fn();
        let button;
        let buttons = massActionsComponent.shadowRoot.querySelectorAll('lightning-menu-item');
        for (let i = 0; i < buttons.length; i++) {
            if (buttons[i].value === 'export') {
                button = buttons[i];
                break;
            }
        }

        const callBack = (event) => {
            mockFn();
            expect(mockFn).toHaveBeenCalled();
        }

        let event = new window.Event('click');
        massActionsComponent.addEventListener('massactionevent', callBack);

        return Promise.resolve().then(() => {
            button.dispatchEvent(event);
        });
    });
});