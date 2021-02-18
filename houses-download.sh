jsonOutputPath="data/houses-$(date +%Y-%m-%d)-4.json"
csvOutputPath="data/houses-$(date +%Y-%m-%d)-4.tsv"

mkdir -p "data/"

#curl \
#'https://api53.realtor.ca/Listing.svc/PropertySearch?'\
#'&ZoomLevel=11'\
#'&LongitudeMax=-52.0585470'\
#'&LatitudeMax=47.7496295'\
#'&LatitudeMin=47.3729289'\
#'&LongitudeMin=-53.3666066'\
#'&TransactionTypeId=2'\
#'&PropertyTypeId=300'\
#'&PriceMin=275000'\
#'&PriceMax=450000'\
#'&BedRange=0-0'\
#'&BathRange=0-0'\
#'&StoreyRange=0-0'\
#'&SearchFormType=RES'\
#'&ApplicationId=53'\
#'&CultureId=1'\
#'&PropertyTypeGroupID=1'\
#'&RecordsPerPage=15000'\
#'&Token=D6TmfZprLI/pMffIdRWjMNkkFFh2ZN/nOiuymgASp2k='\
#'&GUID=8b0ea6a9-7a54-4ae2-9673-354e1b1d367f'\
#'&_=1495302770316'\
# -H 'Origin: https://m.realtor.ca'\
# -H 'Accept-Encoding: gzip, deflate, sdch, br'\
# -H 'Accept-Language: en-US,en;q=0.8'\
# -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/57.0.2987.98 Chrome/57.0.2987.98 Safari/537.36'\
# -H 'Accept: application/json, text/javascript, */*; q=0.01'\
# -H 'Connection: keep-alive'\
# -H 'DNT: 1'\
# --compressed

# 

curl \
	'https://api2.realtor.ca/Listing.svc/PropertySearch_Post'\
	-H 'Cookie: DG_SID=134.41.239.211:0h5kaafDXMPyolYjudkQ5/jfeRPY5aKqMcsChzN/7zQ; ASP.NET_SessionId=pc2rbtupvapjxkh0hz5xsscw; visid_incap_2269415=a2Yi0hzoSt2BeRHOHDnieTGSbF8AAAAAQUIPAAAAAABKMj12T4Ncl1VqUYWWfuuj; nlbi_2269415=uRgqHEchQC7ZSEJ7F6ldsAAAAABaOCA4Rqh4vARRDD7UGJ05; incap_ses_531_2269415=canYPMQTWxQOgizAxH1eBzGSbF8AAAAA9IwMsjyG7TwLq8JmdpwDKw==; nlbi_2269415_2147483646=7YrNSKzFxFmDrRNXF6ldsAAAAACsxVvixCKG2vfVJ0MXIxsx; gig_bootstrap_3_mrQiIl6ov44s2X3j6NGWVZ9SDDtplqV7WgdcyEpGYnYxl7ygDWPQHqQqtpSiUfko=gigya-pr_ver3; reese84=3:jfG3JJbLIgd9fU5ERFXMgQ==:gmKHvhLnU/1x/6P1LfD0EYh5wa3nG+VrFkvmCkDkkX0A94oR2wGrxzksaVc38uCUdJCe+dE/m2vXSbksU9S4cQGCXbU4VXMURf3w/VqWYxoKwJ5VBke/UPfERRtEVYeJsjnJwpki9Q4FKf6RNyzpwAARwfSKJdyr+N5qGvLZVU90dZnA1zeMCuXf+itvIDGuEed5P1ia3pn7N53f1yWpXJiA0nMnkykizWzti/AKbEHfXLulMJfAc4khV1qKUG+j9t+89m7gDEfDNaxHreyYCfNbVZ+WqkYBAaPzXt/D4ZxQZn44L45gzhyw73ZCt5yKqPr4cfHfW19z0nFPb6VEcQ5BLTDl16ui05EAer/zBUNFew2lDE6Bg+Rc55P7MBNaxVaAIlUeLU2d3CaIVim+5q7ZnJ9ifj+962M8dxo4Htk=:3aa0d7oncHlRezO1uEDwHoAvtl1UU+wsbHROYWpl/iw=; visid_incap_2271082=nroWDl6tQLSne+10mfcvRNSSbF8AAAAAQUIPAAAAAABgbiogw6yb/Q7+RufgW4vd; nlbi_2271082=EsVHWyJni1YLQCvBgMl8VwAAAABFo5sP1Q7sbD/7iSz6kuVY; incap_ses_531_2271082=eCDFOla4kwcjSy3AxH1eB9aSbF8AAAAArRBeciirx7bnC2LOgmTBbg=='\
	-H 'Pragma: no-cache'\
	-H 'Origin: https://www.realtor.ca'\
	-H 'Accept-Encoding: gzip, deflate, br'\
	-H 'Accept-Language: en-US,en;q=0.8'\
	-H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/61.0.3163.100 Chrome/61.0.3163.100 Safari/537.36'\
	-H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8'\
	-H 'Accept: */*'\
	-H 'Cache-Control: no-cache'\
	-H 'Referer: https://www.realtor.ca/map'\
	-H 'Connection: keep-alive'\
	-H 'TE: Trailers'\
	-H 'DNT: 1'\
	-o "$jsonOutputPath"\
	--compressed\
	--data \
'ZoomLevel=12'\
'&LatitudeMax=47.64025'\
'&LongitudeMax=-52.58945'\
'&LatitudeMin=47.46461'\
'&LongitudeMin=47.46461'\
'&Sort=6-D'\
'&PropertyTypeGroupID=1'\
'&PropertySearchTypeId=1'\
'&TransactionTypeId=2'\
'&PriceMin=200000'\
'&PriceMax=375000'\
'&BedRange=0-0'\
'&BathRange=0-0'\
'&BuildingTypeId=1'\
'&ConstructionStyleId=3'\
'&Currency=CAD'\
'&RecordsPerPage=200'\
'&ApplicationId=1'\
'&CultureId=1'\
'&Version=7.0'\
'&CurrentPage=4'

node houses-to-csv.js "$jsonOutputPath" > "$csvOutputPath"
