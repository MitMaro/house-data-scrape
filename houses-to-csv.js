const assert = require('assert');
const toTitleCase = require('to-title-case');
const uniqueBy = require('lodash.uniqby');
const toLower = require('lodash.tolower');
const startCase = require('lodash.startcase');
const json2csv = require('json2csv');

const SQUARE_METER_ACRE = 4046.856;
const SQUARE_FEET_ACRE = 43560;
const ACRE_HECTARE = 2.471054;

function parseSize(size) {
	if (typeof size !== 'string') {
		return size;
	}
	return Number(
		size
			.toLowerCase()
			.replaceAll(' ', '')
			.replaceAll(',', '')
			.replaceAll('ft', '')
			.replaceAll('\'', '')
	);
}

function acresFromHectare(hectare) {
	hectare = parseSize(hectare);
	return `${(hectare * ACRE_HECTARE).toFixed(3)} acres`;
}

function acresFromSquareMeters(squre_meters) {
	squre_meters = parseSize(squre_meters);
	return `${(squre_meters/SQUARE_METER_ACRE).toFixed(3)} acres`;
}

function acresFromSquareFeet(squre_feet) {
	squre_feet = parseSize(squre_feet);
	return `${(squre_feet/SQUARE_FEET_ACRE).toFixed(3)} acres`;
}

function estimateLotSize(e, f, g, h, def, parse = acresFromSquareFeet) {
	let [a, b, c, d] = [e, f, g, h].map((v) => {
		if (v !== undefined){
			return parseSize(v);
		}
		else {
			return undefined;
		}
	}).sort((x, y) => x-y);

	if (c === undefined && d === undefined) {
		return parse(a * b);
	}

	if ((a/b) > 0.85 && (c/d) > 0.85) {
		return parse(((a+b)/2) * ((c+d)/2));
	}

	return def;
}

function regex_group(regs) {
	if (regs instanceof RegExp) {
		return regs;
	}
	let groups = regs.map((r) => `(?:${r.source})`).join('|');
	return new RegExp(`(?:${groups})`);
}

const REGEX_MAP = [
	['X', [/\s*x\s*/, /\s*by\s*/]],
	['N', /\d[\d, ]*(?:\.[\d ]*)? *(?:'|ft)?/],
	['L.5', [/under 1\/2 acre/]],
	['HA', [/ha/, /hectares/, /hec/]],
	['AC', [/acres?/]],
	['SQ', [/sq ft/, /sq\.?/, /ft\.?/, /sq\/ft/, /sq'/, /sqft/, /sq feet/]],
	['M', [/square meters/, /sq\.? ?meters\.?/, /sq\.? ?m\.?/, /m/, /sq\.? ?metres\.?/]],
].map((m) => [m[0], regex_group(m[1])]);

const lotSizeMap = [
	["Under 0.5 Acres|under 1/2 acre", "< 0.5 acres"],
	["0-4,050 sqft", "< 0.093 acres"],
	["TBD|0-4,050 sqft", "< 0.093 acres"],
	["3/4 acre|.5 - 9.99 acres", "0.75 acres"],
	["1/2 Acre|.5 - 9.99 acres", "0.50 acres"],
	["N/A|under 1/2 acre", "< 0.5 acres"],
	[/N\/A(?:CONDO)?|Unknown/, "Unknown"],
	// 32,670 - 43,559 sqft (3/4 - 1 ac)
	[/^(<N>)<X>(<N>)\s*\|32,670 - 43,559 sqft \(3\/4 - 1 ac\)$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, "0.75 - 1 acres")],
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|32,670 - 43,559 sqft \(3\/4 - 1 ac\)$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "0.75 - 1 acres")],
	// 21,780 - 21,780 - 32,669 sqft (1/2 - 3/4 ac)
	[/^(<N>)<X>(<N>)\s*\|21,780 - 32,669 sqft \(1\/2 - 3\/4 ac\)$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, "0.5 - 0.75 acres")],
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|21,780 - 32,669 sqft \(1\/2 - 3\/4 ac\)$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "0.5 - 0.75 acres")],
	// 10,890 - 21,799 sqft
	[/^(<N>)<X>(<N>)\s*\|10,890 - 21,799 sqft \(1\/4 - 1\/2 ac\)$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, "0.25 - 0.5 acres")],
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|10,890 - 21,799 sqft \(1\/4 - 1\/2 ac\)$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "0.25 - 0.5 acres")],
	// 7,251 - 10,889 sqft
	[/^(<N>)<X>(<N>)\s*\|7,251 - 10,889 sqft$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, "0.17 - 0.25 acres")],
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|7,251 - 10,889 sqft$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "0.17 - 0.25 acres")],
	//10,147 sqft
	[/^(?<area><N>)\s*<SQ>$/i, (m) => acresFromSquareFeet(m.groups.area)],
	//22 x 77 x 20.5 x 77.8|under 1/2 acre
	[/^(<N>)<X>(<N>)\s*\|<L.5>$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, "< 0.5 acres")],
	//50x98|0-4,050 sqft
	[/^(<N>)<X>(<N>)\s*\|0-4,050 sqft$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, "< 0.093 acres")],
	// 50'x97' approx|4,051 - 7,250 sqft
	// 50 x 100|4,051 - 7,250 sqft
	[/^(<N>)<X>(<N>)\s*\|4,051 - 7,250 sqft$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, "0.093 - 0.166 acres")],
	// 100 x 163 x 35  x 148|0-4,050 sqft
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|\.5 - 9\.99 acres$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], ".5 - 9.99 acres")],
	[/^(<N>)<X>(<N>)\s*\|\.5 - 9\.99 acres$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, ".5 - 9.99 acres")],
	// .5 - 9.99 acres
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|4,051 - 7,250 sqft$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "0.093 - 0.166 acres")],
	// 50x110x140x57|4,051 - 7,250 sqft
	// 74.65x93.45x29.9x37.03x52.11|4,051 - 7,250 sqft
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|4,051 - 7,250 sqft$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "0.093 - 0.166 acres")],
	// 5251 sq ft
	[/^(?<area><N>)\s*<SQ>\s*\|.*$/i, ({groups}) => acresFromSquareFeet(groups.area)],
	// 451 sq.meters
	[/^(?<area><N>)\s*<M>\s*\|.*$/i, ({groups}) => acresFromSquareMeters(groups.area)],
	// 277x273x220x245|1 - 3 acres
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|1 - 3 acres$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "1 - 3 acres")],
	// 23 x 222 x 106 x 150|under 1/2 acre
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)\s*\|<L.5>$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "< 0.5 acres")],
	// .575 ha|1 - 3 acres
	[/^\.(?<area><N>)\s*<HA>.*$/i, ({groups}) => acresFromHectare(`0.${groups.area}`)],
	// 1.80 ha
	[/^(?<area><N>)\s*<HA>.*$/i, ({groups}) => acresFromHectare(groups.area)],
	// .80 acre
	[/^\.(?<area><N>)\s*<AC>.*$/i, ({groups}) => `${parseSize(`0.${groups.area}`)} acres`],
	// 1021 m2|under 1/2 acre
	[/^(?<area><N>)\s*m2\|under 1\/2 acre$/i, ({groups}) => acresFromSquareMeters(groups.area)],
	[/^(?<area><N>)\s*square meters$/i, ({groups}) => acresFromSquareMeters(groups.area)],
	// 1 acre|.5 - 9.99 acres
	// 2.22 acres|1 - 3 acres
	[/^(?<area><N>)\s*<AC>\|.*$/i, ({groups}) => `${parseSize(groups.area)} acres`], // [/^(?<area>\d+[.]?\d*)\s*acres?\s*(?:app?rox\.?)?\|.*$/i, (matches) => {
	// ~0.20 acres|under 1/2 acre
	[/^~(?<area><N>)\s*<AC>\|.*$/i, (m) => `${parseSize(m.groups.area)} acres`],
	// 0.20 acres
	[/^(?<area><N>)\s*<AC>$/i, (m) => `${parseSize(m.groups.area)} acres`],
	[/^(<N>)<X>(<N>)\s*(?:<SQ>)?$/i, (matches) => estimateLotSize(matches[1], matches[2], undefined, undefined, "")],
	[/^(<N>)<X>(<N>)<X>(<N>)<X>(<N>)$/i, (matches) => estimateLotSize(matches[1], matches[2], matches[3], matches[4], "")],
	// catch all
	[/^.*\|0-4,050 sqft$/i, () => "< 0.093 acres"],
	[/^.*\|4,051 - 7,250 sqft$/i, () => "0.093 - 0.166 acres"],
	[/^.*\|7,251 - 10,889 sqft$/i, () => "0.17 - 0.25 acres"],
	[/^.*\|10,890 - 21,799 sqft \(1\/4 - 1\/2 ac\)$/i, () => "0.25 - 0.5 acres"],
	[/^.*\|21,780 - 32,669 sqft \(1\/2 - 3\/4 ac\)$/i, () => "0.5 - 0.75 acres"],
	[/^.*\|32,670 - 43,559 sqft \(3\/4 - 1 ac\)$/i, () => "0.75 - 1 acres"],
	[/^.*\|1 - 3 acres$/i, () => "1 - 3 acres"],
	[/^.*\|3 - 10 acres$/i, () => "3 - 10 acres"],
	[/^.*\|10 - 50 acres$/i, () => "10 - 50 acres"],
	[/^.*\|50\+ acres$/i, () => "50+ acres"],
	[/^.*\|10\+ acres$/i, () => "10+ acres"],
	[/^.*\|under 1\/2 acre$/i, () => "< 0.5 acres"],
	[/^1\/2 acre\|.*$/i, () => "0.5 acres"],
	[/^1\/3 acre\|.*$/i, () => "0.33 acres"],
	[/^1\/4 acre\|.*$/i, () => "0.25 acres"],
	[/^3\/4 acre\|.*$/i, () => "0.75 acres"],
	[/^.*\|\.5 - 9\.99 acres$/i, () => "0.5 - 9.99 acres"],
].map((sizeMap) => {
	if (sizeMap[0] instanceof RegExp) {
		let source = sizeMap[0].source;
		for (const [k, r] of REGEX_MAP) {
			source = source.replaceAll(`<${k}>`, r.source);
		}
		sizeMap[0] = new RegExp(source, sizeMap[0].flags);
	}
	return sizeMap;
});

function processLotSize(size) {
	let i = 0;
	for (const sizeMap of lotSizeMap) {
		const cleanedSize = size
			.replaceAll('""', '')
			.replaceAll('\t', ' ')
			.replaceAll('XX', 'x')
			.replaceAll('*', 'x')
			.replaceAll('FEET ', '')
			.replaceAll('APPROXIMATELY', '')
			.replaceAll('Approximately', '')
			.replaceAll('approximate', '')
			.replaceAll('(approx)', '')
			.replaceAll('(APPROX.)', '')
			.replaceAll('approx.', '')
			.replaceAll('approx', '')
			.replaceAll('Approx.', '')
			.replaceAll('Approx', '')
			.replaceAll('APPROX', '')
			.trim()
		;
		if (sizeMap[0] instanceof RegExp) {
			const matches = cleanedSize.match(sizeMap[0]);
			if (matches !== null) {
				let area;
				if (typeof sizeMap[1] === "string") {
					area = sizeMap[1];
				}
				else {
					area = sizeMap[1](matches);
				}
				if (`${area}`.includes('NaN')) {
					console.error(`NAN: ${size}`);
					console.error(matches, sizeMap[0]);
				}
				return area;
			}
		}
		else {
			if (cleanedSize === sizeMap[0]) {
				return sizeMap[1];
			}
		}
		i++;
	}
	return '';
}

let keys = new Set();
const results = uniqueBy(
	[].concat(...process.argv.slice(2).map((file) => require(`./${file}`).Results)),
	'MlsNumber'
)
.filter((result) => {
    return result !== undefined;
})
.map((result) => {
	if (result.Property.OwnershipType !== 'Freehold' && result.Property.OwnershipType !== undefined) {
		console.error(`Non-Freehold: ${result.Property.OwnershipType} - https://www.realtor.ca/${result.RelativeDetailsURL}`)
	}

	if (!result.PostalCode.toLowerCase().startsWith('a')) {
		console.error(`Non-Newfoundland Postal Code: ${result.PostalCode} - https://www.realtor.ca/${result.RelativeDetailsURL}`)
	}

	for(let key of Object.keys(result)) {
		keys.add(key);
		if (["Property", "Business", "Land"].includes(key)) {
			for(let key2 of Object.keys(result[key])) {
				keys.add(`${key}.${key2}`);
			}
		}
	}
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

	if (!result.RelativeDetailsURL.startsWith('/')) {
		result.RelativeDetailsURL = `/${result.RelativeDetailsURL}`;
	}

	return {
		mls: result.MlsNumber,
		price: result.Property.Price.replace('$', '').replace(',', ''),
		type: result.Building.Type ? result.Building.Type : result.Property.Type,
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
		url: `https://www.realtor.ca${result.RelativeDetailsURL}`,
		accessType: result.Land.AccessType,
		timeOnRealtor: result.TimeOnRealtor,
		agentName: startCase(toLower(result.Individual[0].Name)),
	}
});

// console.error([...keys.values()].sort());

console.log(json2csv({data: results, del: '\t'}));
