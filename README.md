# LWC Listview

[![codecov](https://codecov.io/gh/shliachtx/lwc-listview/branch/master/graph/badge.svg)](https://codecov.io/gh/shliachtx/lwc-listview)


_No warranty is provided, express or implied_

[Install unlocked package](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t6g000008aqeqAAA) version 0.13.5

## Release Notes
### 0.13.5
- Add the ability to show an icon in the header
- Display errors on datatable
- Block sorting on fields that are not sortable
- Fix issue where newly inserted records would show duplicates if the table was refreshed immediately after creating the new record.
- Fix issues with picklist field. (thanks to @tsalb for his help with this)
### 0.11.0
- Add `editFieldName` option to datatable - allows for field fronting in edit mode
### 0.10.0
- Change live data updates to use PushTopic
### 0.8.0
- Add support for Change Data Capture.
### 0.7.0
- Fix problem with infinite loading sometimes not working.
### 0.6.0
- Picklist fields dropdown are auto populated, options will now override the default. Does not support RecordType dependent picklists.
### 0.4.0
- Picklist fields! The options need to be manually set on the field JSON using the `options` property. Accepts an array of strings or `{label, value}` objects
### 0.3.0
- Allow custom label on datatable columns
- Fix issue in related list that prevented using a filter string if there was no parent-child relationship set.
### 0.2.0
- Add option to create a record from a related list
### 0.1.0
- Add option to edit related list inline


## Dev, Build and Test

To setup, clone the repository locally, and from the home directory run `$ yarn`.

To test lwc components locally run `$ yarn:test` with sfdx installed.

To deploy authorize a dev hub in sfdx and run `$ sfdx force:org:create -f config/project-scratch-def.json -a MyScratchOrg` followed by `$ sfdx force:source:push -u MyScratchOrg`


## Resources

## Description of Files and Directories

### [datatable](force-app/main/default/lwc/datatable)
Takes as input an sObject and an array of fields and populates a datatable with records from the database.

Note: Streaming update support utilizes the PushTopic feature, which has a maximum of 50 PushTopic records per org. The datatable uses one for each object type that has live updates enabled. They can be deleted or deactivated if necessary - use `SELECT Id, IsActive FROM PushTopic WHERE Name LIKE 'easydt__%` to retrieve them via SOQL.

### [Custom Related List](force-app/main/default/lwc/relatedList)
Related list for use on lightning app and record pages. Choose object, fields, etc.

Fields accepts a comma separated list of fields, or a JSON list with field information. For more documentation see [datatable](force-app/main/default/lwc/datatable)

![](resources/datatable/demo.gif)

## Issues
