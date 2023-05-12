'use strict';

const fs = require('fs-extra');
const path = require("path");
const {parse} = require('csv-parse/sync');
const moment = require('moment');
const Database = require("better-sqlite3");
const isEqual = require('lodash.isequal');

async function init(dataFile, databaseFile) {
	const db = new Database(databaseFile);
	db.pragma('journal_mode = WAL');

	const getListingsMLSQuery = db.prepare([
		'SELECT',
		"   listing.id,",
		"   listing.mls",
		"FROM listing",
		"WHERE 1=1",
		"AND listing.delistedAt IS NULL",
	].join("\n"));
	const getListingQuery = db.prepare([
		'SELECT',
		"   *",
		"FROM listing",
		"WHERE 1=1",
		"AND listing.mls = :mls",
		"AND (listing.year = :year OR listing.year = :previousYear)",
	].join("\n"));
	const insertListingQuery = db.prepare([
		'INSERT INTO listing (',
		'    mls,',
		'    year,',
		'    price,',
		'    type,',
		'    size,',
		'    stories,',
		'    bathrooms,',
		'    bedroomsAboveGrade,',
		'    bedroomsBelowGrade,',
		'    address,',
		'    postalCode,',
		'    longitude,',
		'    latitude,',
		'    lotClean,',
		'    lotRaw,',
		'    parking1Type,',
		'    parking1Spaces,',
		'    parking2Type,',
		'    parking2Spaces,',
		'    parking3Type,',
		'    parking3Spaces,',
		'    url,',
		'    accessType,',
		'    agentName,',
		'    createdAt,',
		'    updateAt',
		')',
		'VALUES (',
		'    :mls,',
		'    :year,',
		'    :price,',
		'    :type,',
		'    :size,',
		'    :stories,',
		'    :bathrooms,',
		'    :bedroomsAboveGrade,',
		'    :bedroomsBelowGrade,',
		'    :address,',
		'    :postalCode,',
		'    :longitude,',
		'    :latitude,',
		'    :lotClean,',
		'    :lotRaw,',
		'    :parking1Type,',
		'    :parking1Spaces,',
		'    :parking2Type,',
		'    :parking2Spaces,',
		'    :parking3Type,',
		'    :parking3Spaces,',
		'    :url,',
		'    :accessType,',
		'    :agentName,',
		'    :createdAt,',
		'    :updateAt',
		')',
	].join("\n"));
	const insertListingChangeQuery = db.prepare([
		'INSERT INTO listingUpdates (',
		'    listingId,',
		'    updateAt,',
		'    fieldName,',
		'    oldValue,',
		'    newValue',
		')',
		'VALUES (',
		'    :listingId,',
		'    :updateAt,',
		'    :fieldName,',
		'    :oldValue,',
		'    :newValue',
		')',
	].join("\n"));
	const updateListingQuery = db.prepare([
		'UPDATE listing SET',
		'    price = :price,',
		'    type = :type,',
		'    size = :size,',
		'    stories = :stories,',
		'    bathrooms = :bathrooms,',
		'    bedroomsAboveGrade = :bedroomsAboveGrade,',
		'    bedroomsBelowGrade = :bedroomsBelowGrade,',
		'    address = :address,',
		'    postalCode = :postalCode,',
		'    longitude = :longitude,',
		'    latitude = :latitude,',
		'    lotClean = :lotClean,',
		'    lotRaw = :lotRaw,',
		'    parking1Type = :parking1Type,',
		'    parking1Spaces = :parking1Spaces,',
		'    parking2Type = :parking2Type,',
		'    parking2Spaces = :parking2Spaces,',
		'    parking3Type = :parking3Type,',
		'    parking3Spaces = :parking3Spaces,',
		'    url = :url,',
		'    accessType = :accessType,',
		'    agentName = :agentName,',
		'    updateAt = :updateAt',
		"WHERE id = :id",
	].join("\n"));
	const delistListingQuery = db.prepare([
		'UPDATE listing SET',
		'    delistedAt = :delistedAt',
		"WHERE id = :id",
	].join("\n"));

	if (!await fs.pathExists(dataFile)) {
		console.error(`The provided data file does not exist: ${dataFile}`);
		process.exitCode = 1;
		return;
	}

	const data = parse(await fs.readFile(dataFile), {delimiter: '\t'});

	return {
		db,
		data,
		queries: {
			getListingsMLSQuery,
			getListingQuery,
			insertListingQuery,
			insertListingChangeQuery,
			updateListingQuery,
			delistListingQuery,
		}
	};
}

function listingArrayToObj(listing) {
	const [
		mls,
		price,
		type,
		ownership,
		size,
		stories,
		bathrooms,
		bedroomsAboveGrade,
		bedroomsBelowGrade,
		address,
		postalCode,
		longitude,
		latitude,
		lotClean,
		parking1Type,
		parking1Spaces,
		parking2Type,
		parking2Spaces,
		parking3Type,
		parking3Spaces,
		lotRaw,
		url,
		accessType,
		timeOnRealtor,
		agentName
	] = listing;

	return {
		mls,
		price,
		type,
		ownership,
		size,
		stories,
		bathrooms,
		bedroomsAboveGrade,
		bedroomsBelowGrade,
		address,
		postalCode,
		longitude,
		latitude,
		lotClean,
		parking1Type,
		parking1Spaces,
		parking2Type,
		parking2Spaces,
		parking3Type,
		parking3Spaces,
		lotRaw,
		url,
		accessType,
		timeOnRealtor,
		agentName
	};
}

function listingDataToQueryObj(date, listing) {
	return {
		price: listing.price,
		type: listing.type,
		size: listing.size,
		stories: listing.stories,
		bathrooms: listing.bathrooms,
		bedroomsAboveGrade: listing.bedroomsAboveGrade,
		bedroomsBelowGrade: listing.bedroomsBelowGrade,
		address: listing.address,
		postalCode: listing.postalCode,
		longitude: listing.longitude,
		latitude: listing.latitude,
		lotClean: listing.lotClean,
		lotRaw: listing.lotRaw,
		parking1Type: listing.parking1Type,
		parking1Spaces: listing.parking1Spaces,
		parking2Type: listing.parking2Type,
		parking2Spaces: listing.parking2Spaces,
		parking3Type: listing.parking3Type,
		parking3Spaces: listing.parking3Spaces,
		url: listing.url,
		accessType: listing.accessType,
		agentName: listing.agentName,
		updateAt: date.toISOString()
	};
}

const updatableKeys = [
	'price',
	'type',
	'size',
	'stories',
	'bathrooms',
	'bedroomsAboveGrade',
	'bedroomsBelowGrade',
	'address',
	'postalCode',
	'longitude',
	'latitude',
	'lotClean',
	'lotRaw',
	'parking1Type',
	'parking1Spaces',
	'parking2Type',
	'parking2Spaces',
	'parking3Type',
	'parking3Spaces',
	'url',
	'accessType',
	'agentName',
]
function updateListing(queries, date, existing, listing) {
	const changes = [];
	for (const key of updatableKeys) {
		if (`${existing[key]}` !== listing[key]) {
			changes.push({
				listingId: existing.id,
				updateAt: date.toISOString(),
				fieldName: key,
				oldValue: `${existing[key]}`,
				newValue: listing[key],
			})
		}
	}
	if (changes.length === 0) {
		return;
	}

	console.log(`Updating: ${listing.mls}`);

	queries.updateListingQuery.run({
		id: `${existing.id}`,
		...listingDataToQueryObj(date, listing),
	});

	for(const change of changes) {
		queries.insertListingChangeQuery.run(change);
	}
}

const expectedColumns = [
  'mls',                'price',
  'type',               'ownership',
  'size',               'stories',
  'bathrooms',          'bedroomsAboveGrade',
  'bedroomsBelowGrade', 'address',
  'postalcode',         'longitude',
  'latitude',           'lot',
  'parking1Type',       'parking1Spaces',
  'parking2Type',       'parking2Spaces',
  'parking3Type',       'parking3Spaces',
  'rawLow',             'url',
  'accessType',         'timeOnRealtor',
  'agentName'
];

async function syncListing(dateStr, dataFile, databaseFile){
	const {db, data, queries} = await init(dataFile, databaseFile);

	if (!isEqual(expectedColumns, data[0])) {
		console.log(`${dataFile} is invalid`);
		process.exitCode = 1;
		return;
	}

	const date = moment.utc(dateStr, 'YYYY-MM-DD').utc(false);

	const transact = db.transaction((listings) => {
		const mlsList = [];
		for (const listingAry of listings) {
			const listing = listingArrayToObj(listingAry);

			mlsList.push(listing.mls);

			let existing = queries.getListingQuery.get({
				mls: listing.mls,
				year: date.year(),
				previousYear: date.year() - 1,
			});

			if (existing !== undefined) {
				if (moment(existing.updateAt) > date) {
					console.log("Current Record is newer, skipping");
					continue;
				}
				updateListing(queries, date, existing, listing);
			}
			else {
				console.log(`Inserting: ${listing.mls}`);
				queries.insertListingQuery.run({
					mls: listing.mls,
					year: date.year(),
					createdAt: date.subtract(listing.timeOnRealtor, 'days').toISOString(),
					...listingDataToQueryObj(date, listing)
				});
			}
		}

		const currentListings = queries.getListingsMLSQuery.all();

		for (const listing of currentListings) {
			if (!mlsList.includes(`${listing.mls}`)) {
				console.log(`Delisting: ${listing.mls}`);
				queries.delistListingQuery.run({
					id: listing.id,
					delistedAt: date.toISOString()
				});
			}
		}


	});
	transact(data.slice(1));
}

(async () => {
	try {
		const tsvFilePath = process.argv[3];
		const dateStr = process.argv[2];
		const databasePath = path.resolve(process.cwd(), 'data.sqlite');

		await syncListing(dateStr, tsvFilePath, databasePath);
	}
	catch (err) {
		console.error(err);
		process.exitCode = 1;
	}
})()

