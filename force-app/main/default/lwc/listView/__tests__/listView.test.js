import { createElement } from 'lwc';
import listView from 'c/listView';
import { loadScript } from 'lightning/platformResourceLoader';


window.ExportToCSV = () => {
    this.Run = () => {
        return new Promise().resolve('success');
    }
}

describe('c-list-view', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        // Clear mocks so that every test run has a clean implementation
        jest.clearAllMocks();
    });

    const setUpListView = () => {
        // Create list view element
        const element = createElement('c-list-view', {
            is: listView
        });

        element.sObject = 'Contact';
        element.fields = [
            { fieldName: 'Id' },
            { fieldName: 'Name', label: 'Name', sortable: true, sorted: true, sortDirection: 'asc', selected: true },
            { fieldName: 'Account.Name', label: 'AccountName', sortable: true, selected: true },
            { fieldName: 'Age__c', label: 'Age', sortable: true, selected: false },
            { fieldName: 'Email__c', label: 'Email', sortable: false, selected: false }
        ];
        element.massActions = '[{"label": "Export As CSV", "value": "export"}]';
        element.actionButtons = '[{"label": "Create", "value": "new-record"},{"label": "temp1", "value": "temp1"}]';
        return element;
    }

    it('creates soql for export', () => {
        let listViewElement = setUpListView();
        document.body.appendChild(listViewElement);
        return Promise.resolve().then(() => {
            let dataTableQuery = listViewElement.shadowRoot.querySelector('c-datatable').query;
            expect(dataTableQuery).toBe('SELECT Id, Name, Account.Name FROM Contact ORDER BY Name asc nulls first');
        });
    });

    it('updates soql when fields are updated with event', () => {
        let listViewElement = setUpListView();
        document.body.appendChild(listViewElement);
        return Promise.resolve().then(() => {
            let updatedFields = { detail: {selectedFields: ['Age', 'Name'], nonSelectedFields: ['Email', 'AccountName']}};
            listViewElement.shadowRoot.querySelector('c-list-view-header').dispatchEvent(new CustomEvent('listviewheaderevent', {
                detail: {
                    eventName: 'update-fields', 
                    payload: updatedFields
                }
            }));
        }).then(() => {
            let dataTableFields = listViewElement.shadowRoot.querySelector('c-datatable').fields;
            let fieldsMap = {};

            for (let index = 0; index < dataTableFields.length; index++){
                fieldsMap[dataTableFields[index].fieldName] = 1;
            }

            expect(fieldsMap).toHaveProperty('Age__c');
            expect(fieldsMap).toHaveProperty('Name');
            expect(fieldsMap).not.toHaveProperty('Email__c');
            expect(fieldsMap).not.toHaveProperty('Account.Name');
        });        
    });

    it('properly updates loading status on list view',() => {
        let listViewElement = setUpListView();
        document.body.appendChild(listViewElement);

        let dataTable = listViewElement.shadowRoot.querySelector('c-datatable');

        dataTable.dispatchEvent(new CustomEvent('datatableevent', { detail: { eventName: 'update-loading', payload: true}}));

        expect(listViewElement.loading).toBe(true);
    });

    it('properly toggles showFilter', () => {
        let listViewElement = setUpListView();
        document.body.appendChild(listViewElement);

        let listViewHeader = listViewElement.shadowRoot.querySelector('c-list-view-header');
        let dataTable = listViewElement.shadowRoot.querySelector('c-datatable');

        listViewHeader.dispatchEvent(new CustomEvent('listviewheaderevent', {
            detail: {
                eventName: 'show-filters',
                payload: true
            }
        }));

        expect(dataTable.showFilters).toBe(true);

        listViewHeader.dispatchEvent(new CustomEvent('listviewheaderevent', {
            detail: {
                eventName: 'show-filters',
                payload: false
            }
        }));
        expect(dataTable.showFilters).toBe(false);
    });

    it('updates list view header text', () => {
        let listViewElement = setUpListView();
        document.body.appendChild(listViewElement);

        let dataTable = listViewElement.shadowRoot.querySelector('c-datatable');
        let listViewHeader = listViewElement.shadowRoot.querySelector('c-list-view-header');

        return Promise.resolve().then(() => {
            dataTable.dispatchEvent(new CustomEvent('datatableevent', {
                detail: {
                    payload: 4,
                    eventName: 'update-record-count'
                }}));
        }).then(() => {
            dataTable.dispatchEvent(new CustomEvent('datatableevent', { 
                detail: { 
                    eventName: 'update-filter', payload: 'Age__c'} 
                }));
        }).then(() => {
            dataTable.dispatchEvent(new CustomEvent('datatableevent', { 
                detail: { 
                    eventName: 'update-order-by', payload: 'Email__c' } 
                }));
        }).then(() => {
            expect(listViewHeader.filteredFields).toBe('Age__c');
            expect(listViewHeader.orderBy).toBe('Email__c');
            expect(listViewHeader.numberOfRecords).toBe(4);
        });
    });

    it('updates filters on datatable from seach input', () => {
        let listViewElement = setUpListView();
        document.body.appendChild(listViewElement);

        let listViewHeader = listViewElement.shadowRoot.querySelector('c-list-view-header');
        let dataTable = listViewElement.shadowRoot.querySelector('c-datatable');
        
        return Promise.resolve().then(() => {
            listViewHeader.dispatchEvent(new CustomEvent('listviewheaderevent', {
                detail: {
                    payload: {detail: 'alex'},
                    eventName: 'search'
                }
            }));
        }).then(() => {
            expect(dataTable.search).toBe('alex');
        });
    });

    it('gets export result', () => {
        const LOAD_SCRIPT_ERROR = {
            body: { message: 'An internal server error has occurred' },
            ok: false,
            status: 400,
            statusText: 'Bad Request'
        };

        const LOAD_SCRIPT_SUCCESS = {
            ok: true,
            status: 200,
            statusText: 'Success'
        };

        let listViewElement = setUpListView();
        document.body.appendChild(listViewElement);

        let listViewHeader = listViewElement.shadowRoot.querySelector('c-list-view-header');
        
        return Promise.resolve().then(() => {
            listViewHeader.dispatchEvent(new CustomEvent('listviewheaderevent', {
                detail: {
                    payload: 'export',
                    eventName: 'export'
                }
            }));
        }).then(() => {
            expect(loadScript.mock.calls.length).toBe(1);
        });
    });
});