#!/usr/bin/env bash

# import all existing data into the sqlite database

set -euo pipefail

for filename in data/data-*.tsv; do
	date="${filename/data\/data-/}"
	date="${date/.tsv/}"

	echo "Importing $filename"
	node import-listings.js "$date" "$filename"
done

node import-postalcodes.js data/postal-codes.tsv
