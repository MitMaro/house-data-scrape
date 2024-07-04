'use strict';

const fs = require('fs-extra');
const path = require('path');
const {google} = require('googleapis');

// service account credentials, account much be shared to file
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function authorize() {
	return new google.auth.GoogleAuth({
		keyFile: CREDENTIALS_PATH,
		scopes: SCOPES,
	});
}

async function updateSheet(client, spreadsheetId, postalSheetId, postalSheetFile, rawDataSheetId, rawDataFile) {
	const rawData = (await fs.readFile(rawDataFile)).toString('utf8');
	const postalData = (await fs.readFile(postalSheetFile)).toString('utf8');

	const requests = [];
	const sheets = google.sheets({version: 'v4', auth: client});

	requests.push({
		updateCells: {
			range: {
				sheetId: rawDataSheetId
			},
			fields: '*'
		}
	});

	requests.push({
		updateCells: {
			range: {
				sheetId: postalSheetId
			},
			fields: '*'
		}
	});

	requests.push({
		pasteData: {
			coordinate: {
				sheetId: rawDataSheetId,
				rowIndex: 0,
				columnIndex: 0,
			},
			data: rawData,
			type: 'PASTE_VALUES',
			delimiter: '\t'
		}
	});

	requests.push({
		pasteData: {
			coordinate: {
				sheetId: postalSheetId,
				rowIndex: 0,
				columnIndex: 0,
			},
			data: postalData,
			type: 'PASTE_VALUES',
			delimiter: '\t'
		}
	});

	const batchUpdateRequest = {requests};
	await sheets.spreadsheets.batchUpdate({
		spreadsheetId,
		resource: batchUpdateRequest,
	});
}

(async () => {
	try {
		const client = await authorize();
		const spreadsheetId = process.argv[2];
		const postalSheetId = process.argv[3];
		const tsvPostalFilePath = process.argv[4];
		const rawDataSheetId = process.argv[5];
		const tsvRawDataFilePath = process.argv[6];

		await updateSheet(client, spreadsheetId, postalSheetId, tsvPostalFilePath, rawDataSheetId, tsvRawDataFilePath);
	}
	catch (err) {
		console.error(err);
		process.exitCode = 1;
	}
})()
