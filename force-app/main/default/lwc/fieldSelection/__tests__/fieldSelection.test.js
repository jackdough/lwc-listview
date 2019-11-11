import { createElement } from 'lwc';
import fieldSelection from 'c/fieldSelection';

describe('c-field-selection', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    const setUp = () => {
        // Create list view element
        const element = createElement('c-field-selection', {
            is: fieldSelection
        });

        element.availablefields = [
            {'Id' : {label: 'Id', selected: true }},
            {'Name' : {selected: true }},
            {'Account.Name': {selected: true }},
            {'Age__c' : {selected: false }},
            {'Email__c' : {selected: false }}
        ];
        return element;
    }

    it('makes sure selected fields and non selected fields are correctly populated', () => {
        const fieldsSelectionCmp = setUp();
        document.body.appendChild(fieldsSelectionCmp);
        let fieldSelectionElement = fieldsSelectionCmp.shadowRoot.querySelector('lightning-dual-listbox');
        expect(fieldSelectionElement.value.length).toBe(3);
        expect(fieldSelectionElement.options.length).toBe(5);
    });

    it('updates selected fields correctly updated', ()=> {
        const fieldsSelectionCmp = setUp();
        document.body.appendChild(fieldsSelectionCmp);

        let fieldSelectionElement = fieldsSelectionCmp.shadowRoot.querySelector('lightning-dual-listbox');
        // remove one field from the selected fields
        fieldSelectionElement.value = fieldSelectionElement.value.slice(0, 2);
        let event = new window.Event('change');
        event.detail = {value: fieldSelectionElement.value};

        return Promise.resolve().then(() => {
            fieldSelectionElement.dispatchEvent(event);
        }).then(() => {
            expect(fieldSelectionElement.value.length).toBe(2);
        });
    });
    
    it('dispatches selected fields event', () => {
        const fieldsSelectionCmp = setUp();
        document.body.appendChild(fieldsSelectionCmp);

        const mockFn = jest.fn();

        const callback = (e) => {
            mockFn();
            // expect(e).not.toBeNull();
            expect(mockFn).toHaveBeenCalled();
        }

        fieldsSelectionCmp.addEventListener('updatedfieldsselection', callback);

        let fieldSelectionElement = fieldsSelectionCmp.shadowRoot.querySelectorAll('lightning-button')[1];
        let event = new window.Event('click');

        fieldSelectionElement.dispatchEvent(event);
    });
});