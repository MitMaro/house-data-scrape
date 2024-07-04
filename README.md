# Data Scrape

## Instructions

First dependencies need to be installed using `npm`, `nvm` can be used to install the correct Node.js version. Installation is outside the scope of this readme.

```shell
nvm install 21
nvm use 21
npm install
```

Create a copy of `config.sh.tmp`, called `config.sh`. Inside `config.sh`, set `cookies`, `latitudeMax`, `longitudeMax`, `latitudeMin` and `longitudeMin` to the bounds of you search area. I generally look at the API requests being made in the map viewer. The postal code and raw data will be automatically posted to a Google Sheet, provide the `spreadsheetId`, `rawDataSheetId` and `postalCodeSheetId`, all of which can be obtained from the sheet URL.

To run the data scrape:

```shell
nvm use 21
./run.sh
```

This will output a set of files inside `data/` based on the property type, price range and page number.  Those files will be combined into two files. The first file is `data/data-*.tsv` based on the date, and contains the combined data from the scraping of data. The second file is `data/postal-codes.tsv`, that contains postal code data.

## How it works

The API used to query listing is queried using `curl`, the API is limited to 200 results per query, and has a maximum supported pages. This means that for housing data, it is queried using price ranges to keep the total number of results low. For the vacant land API call, the number of results is low enough to query all the results.

The results of these API calls is cached in the `data/` directory in their raw JSON format. Then a JavaScript script (`houses-to-csv.js`) makes an attempt to combine, de-duplicate and normalize the data from the API. This process isn't perfect, but does a decent job of cleaning up the results. This script outputs a single tab seperated file of all the data.

A second script, `postal-code-lookup.js` will read all the data files in `data/` and produce a lookup between postal code and location. This script uses a heuristic to ensure the accuracy of the lookup table, but could technically produce incorrect data.

A third script, `update-sheet.js` replaces the contents of a sheet using Google Sheets API.
