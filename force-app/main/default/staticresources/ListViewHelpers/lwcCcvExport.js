(function ()
{
    if (window.ExportToCsv === undefined){
        window.ExportToCsv = function (soql, queryFunction)
        {
            const OFFSET = 2000;

            this.filename = '';
            this.fileData = '';
            this.soql = soql;
            this.columns = [];
            this.soqlData = [];
            this.runAgain = true;
            this.offset = 0;
            this.queryFunction = queryFunction;

            // get all the fields being queried and set them as the first row and trim whitespaces
            this.columns = function () {
                return this.soql.match(/(?<=SELECT\s+).*?(?=\s+FROM)/gs)[0].split(',').map(el => {
                    return el.trim();
                });
            }

            this.Run = function ()
            {
                return new Promise((resolve, reject) => {
                    if (this.runAgain) {
                        let queryString = this.constructSoql();
                        this.queryFunction({
                            query: queryString
                        }).then(result => {
                            if (result === undefined) {
                                alert('There was an issue exporting CSV. Query: ' + queryString);
                            } else if (result.length < 1) {
                                this.runAgain = false;
                            } else {
                                this.soqlData = this.soqlData.concat(result);
                                // this.parseQueriedData(result);
                                this.offset += OFFSET;
                            }
                            return this.Run();
                        }).catch(err => {
                            reject(JSON.stringify(err));
                        });
                    } else {
                        try {
                            this.createFile();
                            resolve('success');
                        } catch (e) {
                            reject(e);
                        }
                    }
                });
            };

            this.constructFileName = function()
            {
                let objectName = /FROM(.*)/.exec(this.soql)[1].trim();
                let timestamp = Math.round(new Date().getTime()/1000);
                this.filename = objectName + '-export-' + timestamp + '.csv';
            };

            this.constructSoql = function()
            {
                return this.soql + ' LIMIT 2000 ' + ' OFFSET ' + this.offset;
            };

            // if a record does not have a value for a certain field, it will not be returned from the server, so this function
            // will add the field back with 'N/A' so the columns and values match up
            this.objWithoutMissingFields = function(obj, columns){
                let tempObj = {};                
                for (let i = 0; i < columns.length; i++) {
                    if (obj[columns[i]]) {
                        tempObj[columns[i]] = obj[columns[i]];
                    } else {
                        tempObj[columns[i]] = 'N/A';                        
                    }
                }
                return Object.values(tempObj);
            }

            this.processRow = function (row)
            {
                let returnValue = '';
                for (let i = 0; i < row.length; i++)
                {
                    // process each value within the row
                    let innerValue = row[i] === null ? '' : row[i].toString();
                    // handle date conversions
                    if (row[i] instanceof Date)
                    {
                        innerValue = row[i].toLocaleString();
                    }
                    let result = innerValue.replace(/"/g, '""');
                    if (result.search(/("|,|\n)/g) >= 0)
                    {
                        result = '"' + result + '"';
                    }
                    // add comma
                    if (i > 0)
                    {
                        returnValue += ',';
                    }
                    returnValue += result;
                }
                return returnValue + '\n';
            };

            this.createFile = function ()
            {
                let columns = this.columns();
                this.soqlData.unshift(columns);

                for (let i = 0; i < this.soqlData.length; i++) {
                    let row = this.soqlData[i];
                    if (i === 0) {
                        // process the columns
                        this.fileData += this.processRow(row);
                    } else {
                        // process the records
                        this.fileData += this.processRow(this.objWithoutMissingFields(row, columns));
                    }
                }
                this.constructFileName();
                this.download();
            };

            this.parseQueriedData = function (result)
            {
                for (let i = 0; i < result.length; i++){
                    this.soqlData.push(Object.values(result[i]));
                }
            };

            this.download = function ()
            {
                let hiddenLink = document.createElement('a');
                hiddenLink.href = 'data:text/csv;charset=utf-8,' + encodeURI(this.fileData);
                hiddenLink.target = "_self";
                hiddenLink.download = this.filename;
                document.body.appendChild(hiddenLink);
                hiddenLink.click();

                // let blob = new Blob(
                //     [this.fileData], {
                //     type: 'text/plain'
                // });
                // if (navigator.msSaveBlob)
                // { // IE 10+
                //     navigator.msSaveBlob(blob, this.filename);
                // } else
                // {
                //     let link = document.createElement("a");
                //     if (link.download !== undefined)
                //     {
                //         // feature detection
                //         // Browsers that support HTML5 download attribute
                //         let url = URL.createObjectURL(blob);
                //         link.setAttribute("href", url);
                //         link.setAttribute("download", this.filename);
                //         link.style.visibility = 'hidden';
                //         document.body.appendChild(link);
                //         link.click();
                //         document.body.removeChild(link);
                //     }
                // }
            }
        }
    }
})();



