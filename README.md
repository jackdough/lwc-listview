# LWC Listview

[![codecov](https://codecov.io/gh/shliachtx/lwc-listview/branch/master/graph/badge.svg)](https://codecov.io/gh/shliachtx/lwc-listview)


_No warranty is provided, express or implied_

[Install unlocked package](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t6g000008fW6kAAE) version 0.7.0

## Release Notes
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

### [Custom Related List](force-app/main/default/lwc/relatedList)
Related list for use on lightning app and record pages. Choose object, fields, etc.

Fields accepts a comma separated list of fields, or a JSON list with field information. For more documentation see [datatable](force-app/main/default/lwc/datatable)

![](resources/datatable/demo.gif)

## Issues
