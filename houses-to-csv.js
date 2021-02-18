const assert = require('assert');
const util = require('util');
const toTitleCase = require('to-title-case');
const uniqueBy = require('lodash.uniqby');
const path = require('path');
const json2csv = require('json2csv');

const types = new Set();
const lotSizeMap = [
	[/^(?:app?rox\.?\s?)?([0-9.]+)[']?\s*x\s*([0-9.]+)[']?\s*(?:app?rox\.?)?\|.*(?:(?:acres?)|(?:sqft)).*$/i, (matches) => {
		return `${matches[1]} x ${matches[2]}`;
	}],
	[/^(?:app?rox\.?\s?)?([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\|.*(?:(?:acres?)|(?:sqft)).*$/i, (matches) => {
		return `${matches[1]} x ${matches[2]} x ${matches[3]}`;
	}],
	[/^(?:app?rox\.?\s?)?([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\|.*(?:(?:acres?)|(?:sqft)).*$/i, (matches) => {
		return `${matches[1]} x ${matches[2]} x ${matches[3]} x ${matches[4]}`;
	}],
	[/^(?:app?rox\.?\s?)?([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\|.*(?:(?:acres?)|(?:sqft)).*$/i, (matches) => {
		return `${matches[1]} x ${matches[2]} x ${matches[3]} x ${matches[4]} x ${matches[5]}`;
	}],
	[/^(?:app?rox\.?\s?)?([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\|.*(?:(?:acres?)|(?:sqft)).*$/i, (matches) => {
		return `${matches[1]} x ${matches[2]} x ${matches[3]} x ${matches[4]} x ${matches[5]} x ${matches[6]}`;
	}],
	[/^(?:app?rox\.?\s?)?([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\|.*(?:(?:acres?)|(?:sqft)).*$/i, (matches) => {
		return `${matches[1]} x ${matches[2]} x ${matches[3]} x ${matches[4]} x ${matches[5]} x ${matches[6]} x ${matches[7]}`;
	}],
	[/^([0-9.]+)[']?\s*x\s*([0-9.]+)[']?\s*x\s*([0-9.]+)[']?\s*x\s*([0-9.]+)[']?\|[0-9,]+\s-\s[0-9,]+\ssqft.*$/i, (matches) => {
		return `${matches[1]} x ${matches[2]} x ${matches[3]} x ${matches[4]}`;
	}],
	[/^([0-9]+[.]?[0-9]*)\s*acre[s]?\s*(?:app?rox\.?)?\|.*$/i, (matches) => {
		return `${matches[1]} acres`;
	}],
	[/^([0-9]+[.]?[0-9]*)\s*sq\smeters$/i, (matches) => {
		return `${matches[1]} acres`;
	}],
	[/^([0-9.]+)\s*x\s*([0-9.]+)$/i, (matches) => {
		return `${matches[1]} x ${matches[2]}`;
	}],
	[/^([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)\s*x\s*([0-9.]+)$/i, (matches) => {
		return `${matches[1]} x ${matches[2]} x ${matches[3]} x ${matches[4]}`;
	}],
];

const checkIndex = 3;
function processLotSize(size) {
	let i = 0;
	for (const sizeMap of lotSizeMap) {
		const cleanedSize = size
			.replace('""', '')
			.replace('XX', 'x')
			.trim()
		;
		const matches = cleanedSize.match(sizeMap[0]);
		if (matches !== null) {
			return sizeMap[1](matches);
		}
		i++;
	}
	return '';
}

const results = uniqueBy(
	[].concat(...process.argv.slice(2).map((file) => require(`./${file}`).Results)),
	'MlsNumber'
)
.filter((result) => {
    return (result !== undefined &&
		(result.Building.Type === 'House' || result.Building.Type === undefined)
		&& (result.Property.OwnershipType === 'Freehold' || result.Property.OwnershipType === undefined)
	)
})
.map((result) => {
	const [bedroomsAboveGrade, bedroomsBelowGrade] = (result.Building.Bedrooms || '').split(' + ');
	let parking1 = {Name: '', Spaces: ''};
	let parking2 = {Name: '', Spaces: ''};
	let parking3 = {Name: '', Spaces: ''};
	if (result.Property.Parking) {
		assert(result.Property.Parking.length < 5);
		if (result.Property.Parking[0]) {
			parking1 = result.Property.Parking[0];
		}
		if (result.Property.Parking[1]) {
			parking2 = result.Property.Parking[1];
		}
		if (result.Property.Parking[2]) {
			parking3 = result.Property.Parking[2];
		}
		if (result.Property.Parking[3]) {
			parking3 = parking3 + ', ' + result.Property.Parking[3];
		}
	}

	const lot = processLotSize(result.Land.SizeTotal);
	return {
		mls: result.MlsNumber,
		price: result.Property.Price.replace('$', '').replace(',', ''),
		type: result.Building.Type,
		ownership: result.Property.OwnershipType,
		size: result.Building.SizeInterior ? result.Building.SizeInterior.replace(' sqft', '') : '',
		stories: result.Building.StoriesTotal,
		bathrooms: result.Building.BathroomTotal,
		bedroomsAboveGrade: bedroomsAboveGrade || 0,
		bedroomsBelowGrade: bedroomsBelowGrade || 0,
		address: toTitleCase(result.Property.Address.AddressText.split('|')[0]),
		postalcode: result.PostalCode,
		longitude: result.Property.Address.Longitude,
		latitude: result.Property.Address.Latitude,
		lot,
		parking1Type: parking1.Name,
		parking1Spaces: parking1.Spaces || '',
		parking2Type: parking2.Name,
		parking2Spaces: parking2.Spaces || '',
		parking3Type: parking3.Name,
		parking3Spaces: parking3.Spaces || '',
		rawLow: result.Land.SizeTotal,
		url: `https://www.realtor.ca/${result.RelativeDetailsURL}`
	}
});

console.log(json2csv({data: results, del: '\t'}));
