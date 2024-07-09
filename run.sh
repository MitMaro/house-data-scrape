#!/usr/bin/env bash

## Instructions
## Set latitudeMax, LongitudeMax, LatitudeMin and LongitudeMin to the bounds of you search area
## Will output a set of files inside data/ based on the property type, price range and page number
## Those files will be combined into two files, data/data-*.tsv and data/postal-codes
set -euo pipefail

source config.sh

function download {
	property_type="$1"
	page="${2:-}"
	price_min="${3:-}"
	price_max="${4:-}"

	if [ "${page}" == "" ]; then
		1>&2 echo "Invalid page"
		return 1
	fi


	if [ "$property_type" == "houses" ]; then
		property_type_id=1
	elif [ "$property_type" == "land" ]; then
		property_type_id=6
	else
		1>&2 echo "Invalid property_type, must me 'land' or 'houses', but '${property_type}' given"
		return 1
	fi

	if [ "${price_min}" != "" ]; then
		file_name_price_min_part="-${price_min}"
	else
		file_name_price_min_part=""
	fi
	if [ "${price_max}" != "" ]; then
		file_name_price_max_part="-${price_max}"
	else
		file_name_price_max_part=""
	fi

	jsonOutputPath="data/${property_type}-$(date +%Y-%m-%d)-${page}${file_name_price_min_part}${file_name_price_max_part}.json"

	formData="$(cat <<-EOF | tr -d \\n
		ZoomLevel=$zoomLevel
		&LatitudeMax=$latitudeMax
		&LongitudeMax=$longitudeMax
		&LatitudeMin=$latitudeMin
		&LongitudeMin=$longitudeMin
		&Sort=6-D
		&PropertyTypeGroupID=1
		&PropertySearchTypeId=$property_type_id
		&TransactionTypeId=2
		&Currency=CAD
		&IncludeHiddenListings=true
		&RecordsPerPage=50
		&ApplicationId=1
		&CultureId=1
		&Version=7.0
		&PriceMin=$price_min
		&PriceMax=$price_max
		&CurrentPage=$page
	EOF
	)"

	curl \
		'https://api2.realtor.ca/Listing.svc/PropertySearch_Post'\
		-s\
		-X POST\
		-H "Cookie: $cookies"\
		-H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'\
		-H 'Pragma: no-cache'\
		-H 'Origin: https://www.realtor.ca'\
		-H 'Accept-Encoding: gzip, deflate, br'\
		-H 'Accept-Language: en-US,en;q=0.5'\
		-H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8'\
		-H 'Accept: */*'\
		-H 'Cache-Control: no-cache,no-store'\
		-H 'Referer: https://www.realtor.ca/'\
		-H 'Connection: keep-alive'\
		-H 'TE: Trailers'\
		-H 'DNT: 1'\
		-H 'Sec-Fetch-Dest: empty'\
		-H 'Sec-Fetch-Mode: cors'\
		-H 'Sec-Fetch-Site: same-site'\
		-H 'Sec-GPC: 1'\
		-o "$jsonOutputPath"\
		--compressed\
		--data-raw "${formData}"

		total_pages="$(/usr/bin/python3 -c "$(
		cat <<-EOF
		import json
		with open('$(pwd)/$jsonOutputPath', 'r') as f:
		  data = json.load(f)
		  print(data['Paging']['TotalPages'])
		EOF
		)")"
		total_records="$(/usr/bin/python3 -c "$(
		cat <<-EOF
		import json
		with open('$(pwd)/$jsonOutputPath', 'r') as f:
		  data = json.load(f)
		  print(data['Paging']['TotalRecords'])
		EOF
		)")"

		1>&2 echo "Download complete for ${property_type}, of page ${page} of ${total_pages}, for price \$${price_min} to \$${price_max}. Total records: ${total_records}"
		echo "${total_pages}"

}

function download_house_range() {
	start_price="$1"
	end_price="$2"
	total_pages="$(download "houses" 1 "$start_price" "$end_price")"
	for page in $(seq 2 "$total_pages"); do
		download "houses" "$page" "$start_price" "$end_price" > /dev/null
		sleep 3
	done
}

function download_land_range() {
	total_pages="$(download "land"  1)"
	for page in $(seq 2 "$total_pages"); do
		download "land" "$page" > /dev/null
		sleep 3
	done
}

mkdir -p "data/"

1>&2 echo "Download latest data"
download_house_range 0 100000
download_house_range 100000 250000
download_house_range 250000 450000
download_house_range 450000 1000000
download_house_range 1000000 10000000
download_land_range

todayDate="$(date +%Y-%m-%d)"
tsvOutput="data/data-${todayDate}.tsv"

1>&2 echo "Processing API data"
node houses-to-csv.js data/{houses,land}"-${todayDate}-"*.json > "$tsvOutput"

1>&2 echo "Processing Postal code data"
node postal-code-lookup.js data/*.json > data/postal-codes.tsv

1>&2 echo "Import listing to database"
node import-listings.js "$todayDate" "$tsvOutput"

1>&2 echo "Import postal codes to database"
node import-postalcodes.js data/postal-codes.tsv

1>&2 echo "Update Sheet"
node update-sheet.js "$spreadsheetId" "$postalCodeSheetId" "data/postal-codes.tsv" "$rawDataSheetId" "$tsvOutput"
