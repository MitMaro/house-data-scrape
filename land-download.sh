#!/usr/bin/env bash
## Instructions
## Set LatitudeMax, LongitudeMax, LatitudeMin and LongitudeMin to the bounds of you search area
## PriceMin and PriceMax are helpful
## Doesn't handle pages, so you will need to change CurrentPage=1 to get all results
## Copy the tsv file created into the RawData sheet in the Google Sheet, this needs to be done for each page

page="$1"
jsonOutputPath="data/land-$(date +%Y-%m-%d)-$page.json"

mkdir -p "data/"

curl \
	'https://api2.realtor.ca/Listing.svc/PropertySearch_Post'\
	-s\
	-X POST\
	-H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:96.0) Gecko/20100101 Firefox/96.0'\
    -H 'Cookie: visid_incap_2269415=Kl27gAZSSgSxizO+hmRwJkzoUWIAAAAAQUIPAAAAAAA9TOS++Iu4XvnhYRcbhifN; reese84=3:c8wp7hB6bEeC8ybM5borUQ==:OQFSj5zDpSc4plE/XW6LzrZPSEKB/gn+xDshM1m7hScpNmB6TADs2IjAVc9n9nKrasCZpvfYAZM8oUO+iKYZ7YAgXU+zxPmKegQub8N/f5yXEGG90BU7xi8fdsBr/jKX0y2DwGzl01L44LahaSEekSsoGv29AIHB1cGEMzBu9QUcMzwHuvr8Pz7bzifaLjfPXRI/YTqxX3e49evL8EqJ/dvSkR/gPrW3KfPGEuRNQ2d1UvgdZX/cWNk+Y1nnm5nqfmFx6oow3ESd7oQaHHVgx/LuoRJnuQZI1OV0S+Kq1ba0TabQq51QxiIhNCoj+Lk0Ki6zDWdPTWHbTuhPnpibnSqz/P/kkeZdLulxY8SSrehADIjJzbGzFPF6mBAUBNtn0vw7jLZlflSBp/Lrq8DDmDSl0Wh1CWCXCuTTKoVCCSw=:/cObkPhc7zQBEiYuU8kGCXaiD0K/MZWdFwViVmc2Xwg=; gig_bootstrap_3_mrQiIl6ov44s2X3j6NGWVZ9SDDtplqV7WgdcyEpGYnYxl7ygDWPQHqQqtpSiUfko=gigya-pr_ver4; visid_incap_2271082=6p0744bLSHW2lmu4aFI9HWToUWIAAAAAQUIPAAAAAACvRxU+6JmTBEBVj0akDki1; ASP.NET_SessionId=pc2rbtupvapjxkh0hz5xsscw; nlbi_2269415=ApPAeZmydxjbUeeHkG5lugAAAACxum6L+ldvUFXrksEKbNo2; nlbi_2271082=PG+cRzD+USbWNfWocbDG1QAAAADkTW0pSwB77DWpWGNe+2Xw; nlbi_2269415_2147483646=MOaCUsa940W8INXgkG5lugAAAAAof3niq+hSvNdm8q2pt0Ra; nlbi_2269415_2147483392=vI6ZJEO4QRPg6pYCkG5lugAAAAAdnwNzhkwo1tY+AlVWiDtJ; incap_ses_8217_2269415=mlPQfJ+A0FvlpeiyZqYIckusg2IAAAAAe5xfC28/69t6lGGnWDl0mg==; incap_ses_8217_2271082=HirOSkwOCGWms+iyZqYIclKsg2IAAAAAYQ9DBtKJVXvl4R1gUfggVA=='\
	-H 'Pragma: no-cache'\
	-H 'Origin: https://www.realtor.ca'\
	-H 'Accept-Encoding: gzip, deflate, br'\
	-H 'Accept-Language: en-US,en;q=0.5'\
	-H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8'\
	-H 'Accept: */*'\
	-H 'Cache-Control: no-cache'\
	-H 'Referer: https://www.realtor.ca/'\
	-H 'Connection: keep-alive'\
	-H 'TE: Trailers'\
	-H 'DNT: 1'\
	-o "$jsonOutputPath"\
	--compressed\
	--data \
'ZoomLevel=14'\
'&LatitudeMax=47.78608'\
'&LongitudeMax=-51.89713'\
'&LatitudeMin=47.15391'\
'&LongitudeMin=-53.18939'\
'&Sort=6-D'\
'&PropertyTypeGroupID=1'\
'&PropertySearchTypeId=6'\
'&TransactionTypeId=2'\
'&Currency=CAD'\
'&RecordsPerPage=200'\
'&ApplicationId=1'\
'&CultureId=1'\
'&Version=7.0'\
"&CurrentPage=$page"

total_pages="$(/usr/bin/python3 -c "
import json
with open('$(pwd)/$jsonOutputPath', 'r') as f:
  data = json.load(f)
  print(data['Paging']['TotalPages'])
")"
total_records="$(/usr/bin/python3 -c "
import json
with open('$(pwd)/$jsonOutputPath', 'r') as f:
  data = json.load(f)
  print(data['Paging']['TotalRecords'])
")"

1>&2 echo "Land download complete of page ${page} of ${total_pages}. Total records: ${total_records}"
echo "${total_pages}"
