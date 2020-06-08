import { LightningElement, api, track, wire } from "lwc";
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import { getObjectInfo } from 'lightning/uiObjectInfoApi';


export default class RelatedList extends LightningElement {
  @api showAddButton;
  @api modalEdit;
  _title;
  @api
  get title() {
    return this._title || (this.objectInfo && this.objectInfo.labelPlural) || this.sObject;
  }
  set title(value) {
    this._title = value;
  }
  @api recordId;
  @api objectApiName
  @api sObject;
  @api fields;
  @api sortedBy;
  @api sortedDirection;
  _filter;
  @api
  get filter() {
    if (this._filter && this.parentRelationship) {
      return this._filter + ' AND ' + this.parentRelationship;
    }
    return this._filter || this.parentRelationship;
  }
  set filter(value) {
    this._filter = value;
  }
  @api hideCheckboxColumn;
  @api enableInfiniteLoading;
  @api recordsPerBatch=50;
  @api initialRecords;
  @api showSoql;
  @api parentRecordField;
  @api childRecordField;
  @api editable;
  @api height;
  @api enableLiveUpdates;

  _parentRecordField;
  _childRecordField;
  @track objectInfo;

  @wire(getObjectInfo, { objectApiName: '$sObject' })
  wiredObjectInfo({ error, data }) {
    if (data) {
      this.objectInfo = data;
    } else if (error) {
      this.error(error.statusText + ': ' + error.body.message);
    }
  }


  @wire(getRecord, { recordId: "$recordId", fields: "$fullParentRecordField" })
  parentRecord;

  get fullParentRecordField() {
    return this.objectApiName + "." + this.parentRecordField;
  }

  get parentRecordId() {
    if (!this.parentRecordField) { 
      return undefined;
    } else if (this.parentRecord && this.parentRecord.data) {
      return getFieldValue(this.parentRecord.data, this.fullParentRecordField);
    }
    return "";
  }

  get parentRelationship() {
    if (this.childRecordField && typeof this.parentRecordId !== undefined) {
      return `${this.childRecordField}='${this.parentRecordId}'`;
    }
    return "";
  }

  refresh() {
    this.template.querySelector('c-datatable').refresh();
  }
  get customStyle() {
    if (this.height) {
      return 'height:'+this.height+'px';
    }
    return '';
  }

  get addRecordTitle() {
    return this.objectInfo ? 'New ' + this.objectInfo.label : 'Loading...';
  }

  createNew() {
    this.template.querySelector('c-modal').open();
  }
  handleCancel() {
    this.template.querySelector('c-modal').close();
  }
  handleSuccess() {
    this.template.querySelector('c-datatable').refresh();
    this.template.querySelector('c-modal').close();
  }
}
