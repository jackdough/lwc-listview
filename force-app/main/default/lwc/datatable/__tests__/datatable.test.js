import { createElement } from 'lwc';
import Datatable from 'c/datatable';
import wireTableCache from '@salesforce/apex/DataTableService.wireTableCache';
import getTableCache from '@salesforce/apex/DataTableService.getTableCache';
import { registerLdsTestWireAdapter } from '@salesforce/sfdx-lwc-jest';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRecord } from 'lightning/uiRecordApi';


const mockTableData = require('./data/wireTableCache.json');
const mockObjectInfo = require('./data/getObjectInfo.json');

const wireTableCacheWireAdapter = registerLdsTestWireAdapter(wireTableCache);
const getObjectInfoAdapter = registerLdsTestWireAdapter(getObjectInfo);
const getRecordAdapter = registerLdsTestWireAdapter(getRecord);

jest.mock(
    '@salesforce/apex/DataTableService.getTableCache',
    () => {
        return {
            default: jest.fn()
        };
    },
    { virtual: true }
);

describe('c-datatable', () => {

    const defaultDatatable = () => {
        const element = createElement('c-datatable', {
            is: Datatable
        });

        element.sObject = 'Opportunity';
        element.sortedBy = 'Name';
        element.sortedDirection = 'asc';
        element.fields = [ 
            { fieldName: 'Name', sortable: true },
            { fieldName: 'StageName', sortable: true },
            { fieldName: 'CloseDate', sortable: true }
        ];

        return element;
    }

    function flushPromises() {
        // eslint-disable-next-line no-undef
        return new Promise(resolve => setImmediate(resolve));
    }

    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('creates soql query from fields json', () => {
        // Create element
        const element = defaultDatatable();
        element.fields = [ 
            { fieldName: 'Id'},
            { fieldName: 'Name', sortable: true },
            { fieldName: 'Account.Name', sortable: true}
        ];

        document.body.appendChild(element);
        const expectedQuery = 'SELECT Id,Name,Account.Name FROM Opportunity ORDER BY Name asc nulls first';
        expect(element.query).toBe(expectedQuery);

        return Promise.resolve().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch(expectedQuery);    
        });
    });

    it('accepts json string as fields input', () => {
        // Create element
        const element = defaultDatatable();
        element.fields = JSON.stringify([ 
            { fieldName: 'Id'},
            { fieldName: 'Name', sortable: true },
            { fieldName: 'Account.Name', sortable: true}
        ]);

        document.body.appendChild(element);
        const expectedQuery = 'SELECT Id,Name,Account.Name FROM Opportunity ORDER BY Name asc nulls first';
        expect(element.query).toBe(expectedQuery);

        return Promise.resolve().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch(expectedQuery);    
        });
    });

    it('adds id field if not included', () => {
        // Create element
        const element = defaultDatatable();

        document.body.appendChild(element);
        const expectedQuery = 'SELECT Id,Name,StageName,CloseDate FROM Opportunity ORDER BY Name asc nulls first';
        expect(element.query).toBe(expectedQuery);

        return Promise.resolve().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch(expectedQuery);    
        });
        // expect('hi').toBe('hi');
    });

    it('throws an error if no field is sorted', () => {
        // Create element
        const element = createElement('c-datatable', {
            is: Datatable
        });

        element.sObject = 'Opportunity';
        element.sortedDirection = 'asc';
        element.fields = [ 
            { fieldName: 'Name', sortable: true },
            { fieldName: 'Account.Name', sortable: true }
        ];

        document.body.appendChild(element);

        // Verify soql query
        expect(()=>element.query).toThrow('Sort field is required')
        // expect('hi').toBe('hi');
    });

    it('throws an error if fieldName is not provide', () => {
        const element = defaultDatatable();

        return expect(() => {
            element.fields = [ 
                { sortable: true },
                { fieldName: 'Account.Name', sortable: true }
            ];
        }).toThrow('Field must have a valid `fieldName` property');
    });

    it('adds sort information to column headers', () => {
        const element = defaultDatatable();

        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);
        getObjectInfoAdapter.emit(mockObjectInfo);

        return Promise.resolve().then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            expect(lightningDatatable.columns[0].sortable).toBe(true);
        });
        
    });

    it('adds sort information to datatable', () => {
        const element = defaultDatatable();

        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);

        return Promise.resolve().then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            expect(lightningDatatable).not.toBeNull();
            expect(lightningDatatable.sortedBy).toBe('Id');
            expect(lightningDatatable.sortedDirection).toBe('asc');
        });
        
    });

    it('updates sort field when sort event is received from c-datatable-base', () => {
        const element = defaultDatatable();

        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);

        return Promise.resolve()
            .then(() => {
                const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
                expect(lightningDatatable).not.toBeNull();
                lightningDatatable.dispatchEvent(new CustomEvent('sort', {
                    detail: {
                        fieldName: "Account_Id",
                        sortDirection: "desc"
                    }
                }));
            }).then(() => {
                expect(element.sortedBy).toBe('Account.Name');
                const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
                expect(JSON.parse(request).queryString)
                    .toMatch('SELECT Id,Name,Account.Name FROM Opportunity ORDER BY Account.Name desc nulls last');
                // const accountField = element.fields.find(field=>field.fieldName==='Account.Name');
                // expect(accountField.sorted).toBe(true);
                // expect(accountField.sortDirection).toBe('desc');
            });
    });

    it('loads more data on load event', ()=> {    
        const element = defaultDatatable();
        element.enableInfiniteLoading = true;
        
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);
        getTableCache.mockResolvedValue(mockTableData);
        
        return flushPromises().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch(/LIMIT 50$/);

            const datatable = element.shadowRoot.querySelector('c-datatable-base');
            datatable.dispatchEvent(new CustomEvent('loadmore'));
        
            const imperativeRequest = getTableCache.mock.calls[0][0].tableRequest;
            expect(imperativeRequest).toBe({});
            expect(imperativeRequest.queryString).toMatch(new RegExp('LIMIT 50 OFFSET '+mockTableData.tableData.length+'$'));
        }).then(() => {
            const datatable = element.shadowRoot.querySelector('c-datatable-base');
            //IDK why this isnt working as expected: expect(datatable.enableInfiniteLoading).toBe(false); // if previous loadmore call returned less than requested, disable infinite loading
            datatable.dispatchEvent(new CustomEvent('loadmore'));
            const imperativeRequest = getTableCache.mock.calls[1][0].tableRequest;
            expect(imperativeRequest.queryString).toMatch(new RegExp('LIMIT 50 OFFSET '+(mockTableData.tableData.length*2)+'$'));
        });
    });

    it('loads specified number of records', () => {
        const element = defaultDatatable();

        element.enableInfiniteLoading = true;

        const recordsPerBatch = 10;
        const initialRecords = 20;

        element.recordsPerBatch = recordsPerBatch;
        element.initialRecords = initialRecords;
        
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);
        getTableCache.mockResolvedValue(mockTableData);
        
        return flushPromises().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch(new RegExp('LIMIT '+ 20 + '$'));

            const datatable = element.shadowRoot.querySelector('c-datatable-base');
            datatable.dispatchEvent(new CustomEvent('loadmore'));
            const imperativeRequest = getTableCache.mock.calls[0][0].tableRequest;
            expect(imperativeRequest.queryString).toMatch(new RegExp('LIMIT '+ recordsPerBatch+' OFFSET '+mockTableData.tableData.length+'$'));
        });
    });

    it('initial load falls back to recordsPerBatch', () => {
        const element = defaultDatatable();
        
        const recordsPerBatch = 10;

        element.enableInfiniteLoading = true;
        element.recordsPerBatch = recordsPerBatch;

        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);
        getTableCache.mockResolvedValue(mockTableData);
        
        return flushPromises().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch(new RegExp('LIMIT '+ recordsPerBatch + '$'));
        });
    });

    it('keeps selected rows when they are not present in the table', () => {
        const element = defaultDatatable();
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);

        const idToHide = '0031F00000JKhtVQAT';
        return Promise.resolve()
            .then(() => {
                const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
                lightningDatatable.dispatchEvent(new CustomEvent('rowselection', {
                    detail: {
                        selectedRows: [
                            { Id:idToHide }
                        ]
                    }
                }));
            }).then(() => {
                const modifiedData = JSON.parse(JSON.stringify(mockTableData));
                const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');

                modifiedData.tableData.pop();
                wireTableCacheWireAdapter.emit(modifiedData);
                lightningDatatable.dispatchEvent(new CustomEvent('rowselection', {
                    detail: {
                        selectedRows: []
                    }
                }));
            }).then(() => {
                const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
                expect(lightningDatatable.selectedRows).toContain(idToHide);
                expect(element.selectedRows).toContain(idToHide);
            }).then(() => {
                wireTableCacheWireAdapter.emit(mockTableData);
            }).then(() => {
                const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
                expect(lightningDatatable.selectedRows).toContain(idToHide);
                expect(element.selectedRows).toContain(idToHide);
            });    
    });

    it('clear selected rows on clearSelection', () => {
        const element = defaultDatatable();
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);

        const idToHide = '0031F00000JKhtVQAT';
        return Promise.resolve()
            .then(() => {
                const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
                lightningDatatable.dispatchEvent(new CustomEvent('rowselection', {
                    detail: {
                        selectedRows: [
                            { Id:idToHide }
                        ]
                    }
                }));
            }).then(() => {
                element.clearSelection();
            }).then(() => {
                const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
                expect(lightningDatatable.selectedRows).toHaveLength(0);
                expect(element.selectedRows).toHaveLength(0);
            });
    });

    it('searches for search input', () => {
        const element = defaultDatatable();

        const searchString = 'test'
        element.search = searchString;

        document.body.appendChild(element);
        getObjectInfoAdapter.emit(mockObjectInfo);
        return Promise.resolve().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch('LIKE \'%'+searchString+'%\'');
            expect(element.search).toBe(searchString);
        });

    });
    
    it('does not search relationship fields',() => {
        const element = defaultDatatable();

        const searchString = 'test'
        element.search = searchString;

        document.body.appendChild(element);
        getObjectInfoAdapter.emit(mockObjectInfo);

        return Promise.resolve().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch('LIKE \'%'+searchString+'%\'');
            expect(JSON.parse(request).queryString).not.toMatch('Account.Name LIKE \'%'+searchString+'%\'');
        });
    })

    it('does not search non-text fields',() => {
        const element = defaultDatatable();

        element.fields = [ 
            { fieldName: 'Name', sortable: true },
            { fieldName: 'Account.Name', sortable: true},
            { fieldName: 'CreatedDate', sortable: true},
        ];
        const searchString = 'test'
        element.search = searchString;
        document.body.appendChild(element);
        getObjectInfoAdapter.emit(mockObjectInfo);

        return Promise.resolve().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch('LIKE \'%'+searchString+'%\'');
            expect(JSON.parse(request).queryString).not.toMatch('CreatedDate LIKE \'%'+searchString+'%\'');
        });
    })

    it('always searches fields that are marked searchable=true',() => {
        const element = defaultDatatable();

        element.fields = [ 
            { fieldName: 'Name', sortable: true },
            { fieldName: 'Account.Name', sortable: true, searchable: true}
        ];
        const searchString = 'test'
        element.search = searchString;
        document.body.appendChild(element);
        return Promise.resolve().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch('Account.Name LIKE \'%'+searchString+'%\'');
        });
    })

    it('never searches fields that are marked searchable=false',() => {
        const element = defaultDatatable();

        element.fields = [ 
            { fieldName: 'Name', sortable: true, searchable: false },
            { fieldName: 'Phone', searchable: true},
            { fieldName: 'Account.Name', sortable: true}
        ];
        const searchString = 'test'
        element.search = searchString;
        document.body.appendChild(element);
        return Promise.resolve().then(() => {
            const request = wireTableCacheWireAdapter.getLastConfig().tableRequest;
            expect(JSON.parse(request).queryString).toMatch('LIKE \'%'+searchString+'%\'');
            expect(JSON.parse(request).queryString).not.toMatch(' Name LIKE \'%'+searchString+'%\'');
        });
    })

    it('filters on filter parameter', () => {
        const element = defaultDatatable();

        const filterString = 'Name = \'asdf\''
        element.filter = filterString;

        document.body.appendChild(element);
        return Promise.resolve().then(() => {
            const request = JSON.parse(wireTableCacheWireAdapter.getLastConfig().tableRequest);
            expect(request.queryString).toMatch('WHERE '+filterString);
            expect(element.filter).toBe(filterString);
        });

    });


    it('filters and searches on filter and search parameter', () => {
        const element = defaultDatatable();

        element.fields = [ 
            { fieldName: 'Name', sortable: true, searchable: true },
            { fieldName: 'Account.Name', sortable: true }
        ];


        const filterString = 'Name = \'asdf\''
        const searchString = 'test';
        element.filter = filterString;
        element.search = searchString;
        document.body.appendChild(element);
        return Promise.resolve().then(() => {
            const request = JSON.parse(wireTableCacheWireAdapter.getLastConfig().tableRequest);
            expect(request.queryString).toMatch('WHERE '+filterString);
            expect(request.queryString).toMatch(' LIKE \'%'+searchString+'%\'');            
            expect(element.filter).toBe(filterString);
        });

    });


    it('does not display fields with visible set to false', () => {
        const element = defaultDatatable();

        element.fields = [ 
            { fieldName: 'Name', sortable: true },
            { fieldName: 'CloseDate', sortable: true, visible: false}
        ];

        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);

        return Promise.resolve().then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            const request = JSON.parse(wireTableCacheWireAdapter.getLastConfig().tableRequest);
            expect(request.queryString).toMatch('CloseDate');
            expect(lightningDatatable.columns).not.toEqual(expect.arrayContaining([
                expect.objectContaining({'fieldName': 'CloseDate'})
            ]));
            element.fields = [ 
                { fieldName: 'Name', sortable: true },
                { fieldName: 'CloseDate', sortable: true }
            ];
            wireTableCacheWireAdapter.emit(mockTableData);
        }).then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            const request = JSON.parse(wireTableCacheWireAdapter.getLastConfig().tableRequest);
            expect(lightningDatatable.columns).toEqual(expect.arrayContaining([
                expect.objectContaining({'fieldName': 'CloseDate'})
            ]));
            expect(request.queryString).toMatch('CloseDate');
        });
    });

    it('adds static rowActions to datatable', () => {
        const element = defaultDatatable();

        const callback = jest.fn();
        element.rowActions = [
            { label: 'Do something', callback: callback}
        ];

        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);

        return Promise.resolve().then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            expect(lightningDatatable).not.toBeNull();
            expect(lightningDatatable.columns).toStrictEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'action',
                        typeAttributes: {
                            rowActions: expect.arrayContaining([
                                expect.objectContaining({ label: 'Do something', callback: callback})
                            ]),
                        }
                    })
                ])
            );
        });
    });

    it('adds dynamic rowActions to datatable', () => {
        const element = defaultDatatable();

        const rowActions = jest.fn();

        element.rowActions = rowActions;

        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);

        return Promise.resolve().then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            expect(lightningDatatable).not.toBeNull();
            expect(lightningDatatable.columns).toStrictEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'action',
                        typeAttributes: {
                            rowActions: rowActions,
                        }
                    })
                ])
            );
        });
    });

    it('runs callback on rowaction', () => {
        const element = defaultDatatable();

        const callback = jest.fn();
        
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);
        
        return Promise.resolve().then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            expect(lightningDatatable).not.toBeNull();
            lightningDatatable.dispatchEvent(new CustomEvent('rowaction', {
                detail: {
                    row: lightningDatatable.data[0],
                    action: { 
                        label:'testrowaction', 
                        callback: callback 
                    }
                }
            }));
        }).then(() => {
            expect(callback).toHaveBeenCalled();
        });

    });

    it('updates table with value returned by row action callback', () => {
        const element = defaultDatatable();

        const callback = jest.fn().mockImplementation((row)=>{
            row.Name = 'testname';
            return Promise.resolve(row);
        });
        
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);
        
        return Promise.resolve().then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            expect(lightningDatatable).not.toBeNull();
            lightningDatatable.dispatchEvent(new CustomEvent('rowaction', {
                detail: {
                    row: lightningDatatable.data[0],
                    action: { 
                        label:'testrowaction', 
                        callback: callback 
                    }
                }
            }));
        }).then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            
            expect(callback).toHaveBeenCalled();
            expect(callback.mock.calls[0][0]).toMatchObject(lightningDatatable.data[0]);
            expect(lightningDatatable.data[0]).toMatchObject({
                Id: lightningDatatable.data[0].Id,
                Name: 'testname'
            });
        });

    });

    it('deletes row from table when row action callback returns false', () => {
        const element = defaultDatatable();

        const callback = jest.fn().mockImplementation(()=>false);
        
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);

        
        return Promise.resolve().then(() => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            const row = lightningDatatable.data[0];
            expect(lightningDatatable).not.toBeNull();
            lightningDatatable.dispatchEvent(new CustomEvent('rowaction', {
                detail: {
                    row: row,
                    action: { 
                        label:'testrowaction', 
                        callback: callback 
                    }
                }
            }));
            return row;
        }).then((row) => {
            const lightningDatatable = element.shadowRoot.querySelector('c-datatable-base');
            
            expect(callback).toHaveBeenCalled();
            expect(callback.mock.calls[0][0]).toMatchObject(row);
            expect(lightningDatatable.data).not.toContain(expect.objectContaining({
                Id: row.Id
            }));
        });

    });

    it('fires loaddata event on inital load', () => {
        const element = defaultDatatable();

        const loaddataListener = jest.fn();
        element.addEventListener('loaddata',loaddataListener);
        
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);
        

        return Promise.resolve().then(() => {
            expect(loaddataListener).toHaveBeenCalled();
            expect(loaddataListener.mock.calls[0][0].detail).toMatchObject({
                recordCount: mockTableData.recordCount,
                sortedDirection: 'asc',
                sortedBy: 'Name'
            });
        });

    });

    it('fires rowselection event when row is selected', () => {
        const element = defaultDatatable();
        const rowselectionListener = jest.fn();
        element.addEventListener('rowselection',rowselectionListener);
        
        document.body.appendChild(element);
        wireTableCacheWireAdapter.emit(mockTableData);
        const rowId = 'testid';

        return Promise.resolve().then(() => {
            element.shadowRoot.querySelector('c-datatable-base').dispatchEvent(new CustomEvent('rowselection', {
                detail: {
                    selectedRows: [{Id:rowId}]
                }
            }));
        }).then(() => {
            expect(rowselectionListener).toHaveBeenCalled();
            expect(rowselectionListener.mock.calls[0][0].detail).toMatchObject({
                selectedRows: expect.arrayContaining([rowId])
            });
        });

    });
});