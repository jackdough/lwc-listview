/* eslint-disable no-console */
import { LightningElement, track, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { updateRecord } from "lightning/uiRecordApi";
import { refreshApex } from "@salesforce/apex";
import wireTableCache from "@salesforce/apex/DataTableService.wireTableCache";
import getTableCache from "@salesforce/apex/DataTableService.getTableCache";
import getPushTopic from "@salesforce/apex/DataTableService.getPushTopic";
import * as tableUtils from "c/tableServiceUtils";
import * as datatableUtils from "./datatableUtils";
import { loadStyle } from 'lightning/platformResourceLoader';
import datatablePicklistUrl from '@salesforce/resourceUrl/datatablePicklist'

import {
  subscribe,
  unsubscribe,
  // onError,
  // setDebugFlag,
  // isEmpEnabled,
} from "lightning/empApi";

// import getTableRequest from 'c/tableService';

// import * as filters from 'force/filterLogicLibrary';

// const _defaultQueryString = 'SELECT Id, Name, UserName, Email FROM User';
// const DELAY = 2000;

export default class Datatable extends LightningElement {
  renderedCallback() {
    if (!this.rendered) {
      loadStyle(this, datatablePicklistUrl);
      this.rendered = true;
    }
  }
  rendered = false;

  /***
   * See README.md
   ***/
  // _wiredResults;
  lastEventId = -1;
  lastRefreshTime = -1;
  subscription;
  wiredResults;
  _sObject = "";
  _filter = "";
  _search = "";
  _offset = 0;
  _maxRecords;
  _initialRecords;
  _recordsPerBatch;
  _recordCount;
  _tableRequest = "";
  objectInfo;
  @track errors = {
    rows:{}
  };
  @track _sortedDirection = "asc";
  @track _sortedBy = "";
  @track _enableInfiniteLoading;
  @track _selectedRows = [];
  @track _isLoading = true;
  @track isLoadingMore = false;
  @track draftValues = [];
  @track data;
  @track _columns;
  @track
  _fields = []; /*[ // default value - sample. either way we need to document the sample
    // id fields are ignored
    { fieldName: 'Name', sortable: true, sorted: true, searchable: true, visible: true, sortDirection: 'asc' },
    { fieldName: 'Account.Name', searchable: true, sortable: true}
  ];*/
  @api maxRecords = 2000;
  @api recordsPerBatch = 50;
  @api editable;
  @api showSoql;
  @api 
  get enableLiveUpdates() {
    return this._enableLiveUpdates;
  }
  set enableLiveUpdates(value) {
    this._enableLiveUpdates = value;
    // eslint-disable-next-line no-self-assign
    this.sObject = this.sObject;
  }

  get sortedByFormatted() {
    let name = this._sortedBy;
    if (name.endsWith("Name")) {
      // special case for salesforce relationship fields (this will not work for custom relationships)
      name = name.replace(".Name", "_Id");
      name = name.replace("Name", "Id");
    }
    return name;
  }

  @api
  get sortedBy() {
    return this._sortedBy;
  }
  set sortedBy(value) {
    this._sortedBy = value;
    this.tableRequest = "reset";
  }

  @api
  get sortedDirection() {
    return this._sortedDirection;
  }
  set sortedDirection(value) {
    this._sortedDirection = value;
    this.tableRequest = "reset";
  }

  @api
  get initialRecords() {
    return this._initialRecords || this.recordsPerBatch;
  }
  set initialRecords(value) {
    this._initialRecords = value;
  }

  @api enableInfiniteLoading;

  @api hideCheckboxColumn = false;
  @api
  get recordCount() {
    return this._recordCount;
  }
  @api
  get search() {
    return this._search;
  }
  set search(value) {
    this._tableRequest = this.tableRequest;
    this._search = value;
    this.tableRequest = "reset";
  }

  @api // sObject;
  get sObject() {
    return this._sObject;
  }
  set sObject(value) {
    this._sObject = value;
    if (this.enableLiveUpdates) {
      getPushTopic({ sObjectApiName: value })
        .then( (channelName) => {
          this.channelName = channelName
          // if (isEmpEnabled) { 
            return this.pushTopicSubscribe(channelName) 
          // } 
          // return undefined;
        });
    }

    this.tableRequest = "reset";
  }
  @api // filter;
  get filter() {
    return this._filter;
  }
  set filter(value) {
    this._filter = value;
    this.tableRequest = "reset";
  }

  @api
  get fields() {
    return this._fields;
  }

  set fields(value) {
    if (value && typeof value == "string") {
      value = datatableUtils.createFieldArrayFromString(value);
    } else {
      value = JSON.parse(JSON.stringify(value)); // Deep copy the object because LWC does not allow modifying API attributes THIS WILL NOT WORK IF THERE ARE ANY METHODS ON THE OBJECT
    }

    if (Array.isArray(value)) {
      value = datatableUtils.addDefaultFieldValues(value, this.editable);
    } else {
      this.error("`fields` is required");
    }

    // this._fields = value;
    this.tableRequest = value; // this may not actually be necessary. we might be able to just assign this._fields directly
  }

  /**
   * Sample: { label: 'Show Details', callback: (row)=>{do stuff}}
   * Valid input is an array of row actions, or a function (row, doneCallback) { return [rowActions]}
   */
  @api rowActions;

  @api
  get isLoading() {
    return this._isLoading;
  }

  @api
  get selectedRows() {
    return this._selectedRows; //.map(row => { return row.charAt(0) === '/' ? row.slice(1) : row }); // remove prepended forward slash
  }

  @api
  refresh() {
    this._isLoading = true;
    refreshApex(this.wiredResults)
      .then(() => {
        this._isLoading = false;
      })
      .catch((e) => {
        this.error(e.message);
      });
  }

  @api
  clearSelection() {
    this._selectedRows = [];
  }


  @wire(getObjectInfo, { objectApiName: "$sObject" })
  wiredObjectInfo({ error, data }) {
    if (data) {
      this.objectInfo = data;
      if (this._columns) {
        this._columns = datatableUtils.addObjectInfo(this._columns, this.objectInfo);
      }
    } else if (error) {
      this.error(error.statusText + ": " + error.body.message);
    }
  }

  @wire(wireTableCache, { tableRequest: "$tableRequest" })
  wiredCache(result) {
    this.wiredResults = result;
    let error, data;
    ({ error, data } = result);
    if (data) {
      this.lastRefreshTime = new Date().getTime();
      this.data = tableUtils.applyLinks(
        tableUtils.flattenQueryResult(data.tableData)
      );
      this._offset = this.data.length;

      this._columns = datatableUtils.addFieldMetadata(
        data.tableColumns,
        this.fields
      );
      if (this.objectInfo) {
        this._columns = datatableUtils.addObjectInfo(this._columns, this.objectInfo);
      }
      this._columns = datatableUtils.addRowActions(
        this._columns,
        this.rowActions
      );

      if (this.datatable) this.datatable.selectedRows = this._selectedRows;
      this._enableInfiniteLoading = this.enableInfiniteLoading;
      this._isLoading = false;
      this._recordCount = data.recordCount;
      this.dispatchEvent(
        new CustomEvent("loaddata", {
          detail: {
            recordCount: this.recordCount,
            sortedDirection: this.sortedDirection,
            sortedBy: this.sortedBy,
          },
        })
      );
    } else if (error) {
      this.error(error.statusText + ": " + error.body.message);
    }
  }

  loadMoreData() {
    this.isLoadingMore = true;
    const recordsToLoad = datatableUtils.getNumberOfRecordsToLoad(
      this._offset,
      this.recordsPerBatch,
      this.maxRecords
    );
    return getTableCache({
      tableRequest: {
        queryString:
          this.query + " LIMIT " + recordsToLoad + " OFFSET " + this._offset,
      },
    })
      .then((data) => {
        data = tableUtils.applyLinks(
          tableUtils.flattenQueryResult(data.tableData)
        );
        this.data = this.data.concat(data);
        this.isLoadingMore = false;
        this.datatable.selectedRows = this._selectedRows;
        this._offset += data.length;
        if (this._offset >= this.maxRecords || data.length < recordsToLoad) {
          this._enableInfiniteLoading = false;
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  get datatable() {
    return this.template.querySelector("c-datatable-base");
  }

  get tableRequest() {
    return JSON.stringify({
      sObject: this.sObject,
      filter: this.where,
      queryString: this.query + " LIMIT " + this.initialRecords,
    });
  }

  set tableRequest(value) {
    // this._tableRequest = this.tableRequest;
    if (!Array.isArray(value)) this._fields = [...this._fields];
    // hack to force wire to reload
    else this._fields = value;
    this._isLoading = true;
  }

  @api
  get query() {
    return this.buildQuery(this.fields, this.sObject, this.where, this.orderBy);
  }

  buildQuery(fields, sObject, where, orderBy) {
    let soql =
      "SELECT " +
      (fields.some((field) => field.fieldName === "Id") ? "" : "Id,") + // include Id in query if is not defined
      // (this.fields.some(field => field.fieldName === 'RecordTypeId') ? '' : 'RecordTypeId,') + // include record type Id in query if is not defined
      fields
        // .filter(field => field.visible) // exclude fields set to not be visible
        // .filter(field => field.fieldName.includes('.') || !this.objectInfo && this.objectInfo.fields[field.fieldName]) // exclude fields that are not existent (does not check related fields)
        .map((field) => field.fieldName)
        .join(",") +
      " FROM " +
      sObject +
      where +
      orderBy;
    return soql;
  }

  get where() {
    let filterItems = [this.filter, this.searchQuery].filter(f => f);
    
    if (filterItems.length) {
      return " WHERE " + filterItems.join(' AND ');
    }
    return "";
  }

  get searchQuery() {
    let searchTerm = this.search.replace("'", "\\'");
    let search = this.fields
      .filter((field) => {
        if (Object.prototype.hasOwnProperty.call(field, "searchable")) {
          return field.searchable;
        }
        if (!this.objectInfo || !this.objectInfo.fields[field.fieldName]) {
          return false;
        }
        let fieldType = this.objectInfo.fields[field.fieldName].dataType;
        return (
          fieldType === "String" ||
          fieldType === "Email" ||
          fieldType === "Phone"
        );
      })
      .map((field) => {
        return field.fieldName + " LIKE '%" + searchTerm + "%'";
      })
      .join(" OR ");
    if (search) {
      search = "(" + search + ")";
    }
    return search;
  }

  get orderBy() {
    if (!this.sortedBy) this.error("Sort field is required");
    let sortedDirection =
      this.sortedDirection.toLowerCase() === "desc"
        ? "desc nulls last"
        : "asc nulls first";
    return " ORDER BY " + this.sortedBy + " " + sortedDirection;
  }

  error(err) {
    if (typeof err == "string") err = new Error(err);
    const evt = new ShowToastEvent({
      title: err.name + " - " + err.message,
      message: err.stack,
      variant: "error",
      mode: "sticky",
    });
    this.dispatchEvent(evt);
    // console.error(err);
    throw err;
  }

  // getRowActions(row, renderActions) {
  //   const actions = this.rowActions.filterRowActions(row, this.rowActions.availableActions);
  //   renderActions(actions);
  // }

  updateSortField(event) {
    let fieldName = event.detail.fieldName;
    if (fieldName.endsWith("Link")) {
      // special case for salesforce relationship fields (this will not work for custom relationships)
      fieldName = fieldName.replace("_Link", ".Name");
      fieldName = fieldName.replace("Link", "Name");
    }
    this.sortedBy = fieldName;
    this.sortedDirection = event.detail.sortDirection;

    this.tableRequest = "reset";
  }

  handleRowAction(event) {
    const action = event.detail.action;
    if (action && action.callback) {
      const row = JSON.parse(JSON.stringify(event.detail.row)); // deep copy so changes can be made that will not affect anything
      Promise.resolve(action.callback(row)).then((result) => {
        if (result) {
          this.replaceRow(row.Id, result);
        // eslint-disable-next-line no-empty
        } else if (typeof result === 'undefined') {
        } else {
          this.removeRow(row.Id);
        }
      });
    }
  }

  handleRowSelection(event) {
    let availableRows = this.data.map((row) => row.Id);
    let newRows = event.detail.selectedRows.map((row) => row.Id);

    let selectedRows = this._selectedRows
      .filter((row) => !availableRows.includes(row)) // keep rows that arent in the current table
      .concat(newRows); // add currently selected rows

    this._selectedRows = selectedRows;

    this.dispatchEvent(
      new CustomEvent("rowselection", {
        detail: {
          selectedRows: selectedRows,
        },
      })
    );
  }

  handleSave(event) {
    this._isLoading = true;
    let updatePromises = event.detail.draftValues.map((row) => {
      row = {...row};
      for (let key of Object.keys(row)) { // Replace fieldName with editFieldName before performing the update
        let fieldInfo = this._fields.find(f => f.fieldName === key);
        if (fieldInfo && fieldInfo.editFieldName) {
          row[fieldInfo.editFieldName] = row[key];
          delete row[key]; 
        }
      }
      // let recordForUpdate = generateRecordInputForUpdate({id: row.Id, fields:row},this.objectInfo);
      return updateRecord({ fields: row })
        .then(() => {
          delete this.errors.rows[row.Id];
          if (this.datatable && this.datatable.draftValues) {
            const draftValues = this.datatable.draftValues;
            const draftIndex = draftValues.find(r => r.Id === row.Id);
            draftValues.splice(draftIndex, 1);
            this.datatable.draftValues = [...draftValues];
          }
          return this.refreshRow(row.Id);
        })
        .catch((error) => {
          if (!error || !error.body || !error.body.output) {
            return;
          }
          const formatError = err => err && err.errorCode + ': ' + err.message
          const rowErrorMessages = (error.body.output.errors && error.body.output.errors.map(formatError)) || [];
          const fieldErrors = Object.values(error.body.output.fieldErrors).reduce((acc,current) => acc.concat(current), []);
          const fieldErrorMessages = (fieldErrors && fieldErrors.map(formatError)) || [];
          const messages = [...rowErrorMessages, ...fieldErrorMessages];
          const fieldNames = (fieldErrors && fieldErrors.map(err =>  {
            let fieldInfo = this._fields.find(f => f.editFieldName === err.field); // lookup the original field name
            return (fieldInfo && fieldInfo.fieldName) || err.field;
          })) || [];
          this.errors.rows[row.Id] = {
            title: `We found ${messages.length} error${messages.length > 1 ? 's':''}.`,
            messages,
            fieldNames
          }
        });
    });

    Promise.all(updatePromises)
      // .then(() => {
      //   this.draftValues = [];
      //   this.refresh();
      // })
      .catch((error) => {
        if (error && error.body) {
          this.errors.table = {
            title: "Error updating records",
            message: [error.body.message],
          }
          console.log(JSON.parse(JSON.stringify(error)));
        }
      })
      .then(()=> {
        this.errors = {...this.errors}
        this._isLoading = false;
      });
    console.log(event);
  }

  handleFieldEdit(event) {
    const { value, rowKeyValue, colKeyValue } = event.detail;
    const draftValues = this.template.querySelector("c-datatable-base")
      .draftValues;
    if (rowKeyValue) {
      let currentRow =
        draftValues && draftValues.find((row) => row.Id === rowKeyValue);
      if (!currentRow) {
        currentRow = { Id: rowKeyValue };
        draftValues.push(currentRow);
      }
      currentRow[colKeyValue.split("-")[0]] = value;
      this.draftValues = [...draftValues];
    }
  }

  getRowValue(recordId) {
    let filter =
      this.where + (this.where ? " AND " : " WHERE ") + `Id='${recordId}'`;
    let query = this.buildQuery(
      this.fields,
      this.sObject,
      filter,
      this.orderBy
    );
    return getTableCache({
      tableRequest: {
        queryString: query,
      },
    });
  }

  addRow(recordId) {
    if (this._offset < this.maxRecords) {
      this.getRowValue(recordId).then((data) => {
        const newData = tableUtils.applyLinks(
          tableUtils.flattenQueryResult(data.tableData)
        );

        const rows = this.data;
        const rowIndex = rows.findIndex((r) => r.Id === recordId);
            
        if (rowIndex >= 0) { // Check if row already exists
          rows[rowIndex] = newData[0];
          this.data = [...rows];
        } else {
          this.data = newData.concat(this.data);
        }

        this.datatable.selectedRows = this._selectedRows;
      });
    }
  }

  replaceRow(recordId, row) {
    const rows = this.data;
    const rowIndex = rows.findIndex((r) => r.Id === recordId);
    if (rowIndex >= 0) {
      rows[rowIndex] = row;
      this.data = [...rows];
    }
  }

  refreshRow(recordId) {
    const rows = this.data;
    const rowIndex = rows.findIndex((r) => r.Id === recordId);

    if (rowIndex >= 0) {
      // if row exists
      this.getRowValue(recordId).then((data) => {
        const newData = tableUtils.applyLinks(
          tableUtils.flattenQueryResult(data.tableData)
        );
        rows[rowIndex] = newData[0];

        this.data = [...rows];
      });
    }
  }

  removeRow(recordId) {
    const rows = this.data;
    const rowIndex = rows.findIndex((r) => r.Id === recordId);

    if (rowIndex >= 0) {
      // if row exists
      rows.splice(rowIndex, 1);
      this._offset--;

      this.data = [...rows];
    }
  }

  pushTopicSubscribe(channelName) {
    const messageCallback = (response) => {
      console.log(JSON.parse(JSON.stringify(response)));
      const event = response.data.event;
      const recordId = response.data.sobject.Id;
      if (this.lastEventId < event.replayId && this.lastRefreshTime < new Date(event.createdDate).getTime()) {
        switch (event.type) {
          case "created":
            this.addRow(recordId);
            break;
          case "updated":
            this.refreshRow(recordId);
            break;
          case "deleted":
            this.removeRow(recordId);
            break;
          default:
            break;
        }
      }
    };

    return subscribe(channelName, -1, messageCallback).then((response) => {
      console.log(
        "Successfully subscribed to : ",
        JSON.stringify(response.channel)
      );
      if (this.subscription) {
        unsubscribe(this.subscription, (resp) => {
          console.log(JSON.parse(JSON.stringify(resp)));
        });
      }
      this.subscription = response;
    });
  }
  /*
  // based on https://stackoverflow.com/a/31536517
  createCsv(columns, rows) {
    const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
    const fields = columns.map(col=>col.fieldName);
    let csv = rows.map(row => fields.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(columns.map(col=>JSON.stringify(col.label)).join(','));
    csv = csv.join('\r\n');
  }
  */

  // getPicklistOptions(fieldName) {
  //   getPicklistValues()
  // }

  // getAllRows() {
  //   // return Promise.resolve();
  // }
}
