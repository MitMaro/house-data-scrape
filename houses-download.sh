jsonOutputPath="data/houses-$(date +%Y-%m-%d).json"
csvOutputPath="data/houses-$(date +%Y-%m-%d).tsv"

mkdir -p "data/"

curl \
'https://api2.realtor.ca/Listing.svc/PropertySearch?'\
'&Longitude=-53.0292034149169'\
'&Latitude=47.4847289273665'\
'&TransactionTypeId=2'\
'&PropertyTypeId=300'\
'&PriceMin=275000'\
'&PriceMax=450000'\
'&BedRange=0-0'\
'&BathRange=0-0'\
'&StoreyRange=0-0'\
'&SearchFormType=RES'\
'&ApplicationId=53'\
'&CultureId=1'\
'&PropertyTypeGroupID=1'\
'&Top=200'\
'&Radius=20000'\
'&RecordsPerPage=15000'\
'&Token=D6TmfZprLI/pMffIdRWjMNkkFFh2ZN/nOiuymgASp2k='\
'&GUID=8b0ea6a9-7a54-4ae2-9673-354e1b1d367f'\
'&_=1495302770316'\
 -H 'Origin: https://m.realtor.ca'\
 -H 'Accept-Encoding: gzip, deflate, sdch, br'\
 -H 'Accept-Language: en-US,en;q=0.8'\
 -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/57.0.2987.98 Chrome/57.0.2987.98 Safari/537.36'\
 -H 'Accept: application/json, text/javascript, */*; q=0.01'\
 -H 'Connection: keep-alive'\
 -H 'DNT: 1'\
 --compressed \
 -o "$jsonOutputPath"

node houses-to-csv.js "$jsonOutputPath" > "$csvOutputPath"
