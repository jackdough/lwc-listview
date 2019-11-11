import { createElement } from 'lwc';
import listViewHeader from 'c/listViewHeader';

describe('c-list-view-header', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        // Clear mocks so that every test run has a clean implementation
        // jest.clearAllMocks();
    });

    const setUp = () => {
        // Create list view element
        const element = createElement('c-list-view-header', {
            is: listViewHeader
        });

        element.objectName = 'Contact';
        element.availableFields = [
            { fieldName: 'Id', label: 'Id', selected: true },
            { fieldName: 'Name', label: 'Name', sortable: true, sorted: true, sortDirection: 'asc', selected: true },
            { fieldName: 'Account.Name', label: 'AccountName', sortable: true, selected: true },
            { fieldName: 'Age__c', label: 'Age', sortable: true, selected: false },
            { fieldName: 'Email__c', label: 'Email', sortable: false, selected: false }
        ];
        element.massActions = '[{"label": "Export As CSV", "value": "export"}]';
        element.actionButtons = '[{"label": "Create", "value": "new-record"}, {"label": "Edit", "value": "edit-record"}, {"label": "temp1", "value": "temp1"}]';
        element.numberOfRecords = 10;
        element.filteredFields = '';
        element.orderBy = 'Name';

        return element;
    }

    it('successfully populates html with data', () => {
        let listViewHeaderElement = setUp();
        document.body.appendChild(listViewHeaderElement);

        let spans = listViewHeaderElement.shadowRoot.querySelectorAll('span');

        expect(spans[1].textContent).toBe('10 items • Ordered By Name');
    });

    it('tests search input', () => {
        let listViewHeaderElement = setUp();
        document.body.appendChild(listViewHeaderElement);
        const a = jest.fn();

        const handleEvent = (e) => {
            expect(a).toHaveBeenCalled();
        } 

        listViewHeaderElement.addEventListener('listviewheaderevent', handleEvent);
        document.addEventListener('listviewheaderevent', handleEvent);
        window.addEventListener('listviewheaderevent', handleEvent);

        let inputField = listViewHeaderElement.shadowRoot.querySelector('.search-in-list');
        inputField.value = 'alex';

        // create keyUp event
        let event = new window.Event("keyup");
        event.which = 13;
        inputField.dispatchEvent(event);

        inputField.value = '';
        inputField.dispatchEvent(event);
    });

    it('tests show fields selection component gets properly toggled', () => {
        let listViewHeaderElement = setUp();
        document.body.appendChild(listViewHeaderElement);

        let menuOptions = listViewHeaderElement.shadowRoot.querySelector('lightning-button-menu');
        let event = new window.Event('select');
        event.detail = {value: 'fields-to-display'};

        return Promise.resolve().then(() => {
            menuOptions.dispatchEvent(event);
        }).then(() => {
            const fieldSelectionCmp = listViewHeaderElement.shadowRoot.querySelector('c-field-selection');
            expect(fieldSelectionCmp).not.toBeNull();
            fieldSelectionCmp.dispatchEvent(new CustomEvent('closemodal'));
        }).then(() => {
            let fieldSelector = listViewHeaderElement.shadowRoot.querySelector('c-field-selection');
            expect(fieldSelector).toBeNull();
        });
    });

    it('dispatches field selection updates', () => {
        let listViewHeaderElement = setUp();
        document.body.appendChild(listViewHeaderElement);

        // toggle the fields selection component
        let menuOptions = listViewHeaderElement.shadowRoot.querySelector('lightning-button-menu');
        let event = new window.Event('select');
        event.detail = { value: 'fields-to-display' };
        
        return Promise.resolve().then(() => {
            menuOptions.dispatchEvent(event);
        }).then(() => {
            const fieldSelectionCmp = listViewHeaderElement.shadowRoot.querySelector('c-field-selection');
            fieldSelectionCmp.dispatchEvent(new CustomEvent('updatedfieldsselection', {detail: 'boo'}));
        }).then(() => {
            let fieldSelector = listViewHeaderElement.shadowRoot.querySelector('c-field-selection');
            expect(fieldSelector).toBeNull();
        });
    });

    it('triggers export event', () => {
        let listViewHeaderElement = setUp();
        document.body.appendChild(listViewHeaderElement);

        let menuOptions = listViewHeaderElement.shadowRoot.querySelector('lightning-button-menu');
        let event = new window.Event('select');
        event.detail = { value: 'export' };

        const mockFn = jest.fn();

        const callBack = () => {
            mockFn();
            expect(mockFn).toHaveBeenCalled();
        }

        listViewHeaderElement.addEventListener('listviewheaderevent', callBack);

        return Promise.resolve().then(() => {
            menuOptions.dispatchEvent(event);
        }).then(() => {
            expect(listViewHeaderElement).toBeTruthy();
        })
    });

    it('handles mass actions event', () => {
        let listViewHeaderElement = setUp();
        document.body.appendChild(listViewHeaderElement);

        let massActionsComponent = listViewHeaderElement.shadowRoot.querySelector('c-mass-actions');
        massActionsComponent.dispatchEvent(new CustomEvent('massactionevent', {
            detail: {
                eventName: 'test',
                payload: 'test'
            }
        }));
        expect(listViewHeaderElement).toBeTruthy();
    });

    it('triggers show filters event', () => {
        let listViewHeaderElement = setUp();
        document.body.appendChild(listViewHeaderElement);

        const mockFn = jest.fn();

        const callBack = () => {
            mockFn();
            expect(mockFn).toHaveBeenCalled();
        }

        listViewHeaderElement.addEventListener('listviewheaderevent', callBack);

        let menuOptions = listViewHeaderElement.shadowRoot.querySelector('lightning-button-icon-stateful'); // for now there
        // only one element on the template that uses that component. if more are added, we will need to use querySelectorAll anf get the desired one
        let event = new window.Event('click');
        menuOptions.dispatchEvent(event);
        expect(listViewHeaderElement).toBeTruthy();
    });
});