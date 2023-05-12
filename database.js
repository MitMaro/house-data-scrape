'use strict';

const Database = require('better-sqlite3');
const path = require('path');

function createDatabase (databaseFile){
	const db = new Database(databaseFile);

	db.exec(
		[
			'CREATE TABLE listing (',
			'   id INTEGER PRIMARY KEY NOT NULL,',
			'   mls TEXT NOT NULL,',
			'   year INTEGER NOT NULL,',
			'   price INTEGER NOT NULL,',
			'   type TEXT NOT NULL,',
			"   size INTEGER,",
			"   stories INTEGER,",
			"   bathrooms INTEGER,",
			"   bedroomsAboveGrade INTEGER,",
			"   bedroomsBelowGrade INTEGER,",
			"   address TEXT NOT NULL,",
			"   postalCode TEXT NOT NULL,",
			"   longitude REAL NOT NULL,",
			"   latitude REAL NOT NULL,",
			"   lotClean TEXT,",
			"   lotRaw TEXT,",
			"   parking1Type TEXT,",
			"   parking1Spaces INTEGER,",
			"   parking2Type TEXT,",
			"   parking2Spaces INTEGER,",
			"   parking3Type TEXT,",
			"   parking3Spaces INTEGER,",
			"   url TEXT NOT NULL,",
			"   accessType TEXT,",
			"   agentName TEXT NOT NULL,",
			"   createdAt TEXT NOT NULL,",
			"   updatedAt TEXT NOT NULL,",
			"   delistedAt TEXT,",
			"   UNIQUE (mls, year)",
			")"
		]
		.join('\n')
	);

	db.exec(
		[
			'CREATE TABLE listingUpdates (',
			'   id INTEGER PRIMARY KEY NOT NULL,',
			"   listingId INTEGER NOT NULL,",
			"   updatedAt TEXT NOT NULL,",
			"   fieldName TEXT NOT NULL,",
			"   oldValue TEXT NOT NULL,",
			"   newValue TEXT NOT NULL,",
			"   FOREIGN KEY(listingId) REFERENCES listing(id)",
			")"
		]
		.join('\n')
	);

	db.exec(
		[
			'CREATE TABLE postalCodes (',
			'   id INTEGER PRIMARY KEY NOT NULL,',
			"   postalCode TEXT UNIQUE NOT NULL,",
			"   location TEXT NOT NULL",
			")"
		]
		.join('\n')
	);
}

try {
	createDatabase(path.resolve(process.cwd(), 'data.sqlite'));
}
catch (err) {
	console.error(err);
	process.exitCode = 1;
}
