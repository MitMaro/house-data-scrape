'use strict';

const fs = require('fs-extra');
const path = require("path");
const {parse} = require('csv-parse/sync');
const Database = require("better-sqlite3");

async function init(dataFile, databaseFile) {
	const db = new Database(databaseFile);
	db.pragma('journal_mode = WAL');

	const upsertPostalCodeQuery = db.prepare([
		'INSERT INTO postalCodes (',
		'    postalCode,',
		'    location',
		')',
		'VALUES (',
		'    :postalCode,',
		'    :location',
		')',
		'ON CONFLICT DO UPDATE SET location = :location'
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
			upsertPostalCodeQuery,
		}
	};
}

async function syncPostalCodes(dataFile, databaseFile){
	const {db, data, queries} = await init(dataFile, databaseFile);

	const transact = db.transaction((postalCodes) => {
		for (const postalCode of postalCodes) {
			queries.upsertPostalCodeQuery.run({
				postalCode: postalCode[0],
				location: postalCode[1],
			});
		}

	});
	transact(data.slice(1));
}

(async () => {
	try {
		const tsvFilePath = process.argv[2];
		const databasePath = path.resolve(process.cwd(), 'data.sqlite');

		await syncPostalCodes(tsvFilePath, databasePath);
	}
	catch (err) {
		console.error(err);
		process.exitCode = 1;
	}
})()

