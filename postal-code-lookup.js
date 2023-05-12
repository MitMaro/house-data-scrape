const uniqueBy = require('lodash.uniqby');
const json2csv = require("json2csv");

let verified = {
	'A1A1A1': 'St. John\'s',
};

let skip = [
	'brigus-cupids',
	'st. thomas',
	'st. thomas - paradise -topsail'
];

let replacement_map = {
	'conception by south': 'cbs',
	'comception bay south': 'cbs',
	'concepton bay south': 'cbs',
	'conception bay hwy': 'cbs',
	'long pond': 'cbs',
	'foxtrap': 'cbs',
	'kelligrews': 'cbs',
	'upper gullies': 'cbs',
	'topsail': 'cbs',
	'cbs': 'conception bay south',
	'portual cove': 'portugal cove',
	'st.philip\'s': 'portugal cove',
	'pcsp': 'portugal cove',
	'pradise': 'paradise',
	'paradsie': 'paradise',
	'paradise nl': 'paradise',
	'st.philips': 'st. philips',
	'st-john\'s': 'st. john\'s',
	's. john\'s': 'st. john\'s',
	'st.john\'s': 'st. john\'s',
	'goulds': 'st. john\'s',
	'kilbride': 'st. john\'s',
	'southlands': 'st. john\'s',
	'mt.pearl': 'mt. pearl',
	'mount pearl': 'mt. pearl',
	'bryants cove': 'bryant\'s cove',
	'chapels cove': 'chapel\'s cove',
	'clarkes beach': 'clarke\'s beach',
	'wabanna': 'wabana',
	'lbmcoc': 'logy bay',
	'spaniards bay': 'spaniard\'s bay',
};

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

let testing = new Set();
let postalCodes = {};
uniqueBy(
	[].concat(...process.argv.slice(2).map((file) => require(`./${file}`).Results)),
	'MlsNumber'
)
.filter((result) => {
    return result !== undefined;
})
.map((result) => {
	let postalCode = result.PostalCode.trim().toUpperCase();

	if (!result.PostalCode.toLowerCase().startsWith('a')) {
		return;
	}

	if (postalCodes[postalCode] === undefined) {
		postalCodes[postalCode] = {};
	}

	let address = result.Property.Address.AddressText.split('|')[1];
	if (address === undefined) {
		// console.error(`Skipping: ${result.Property.Address.AddressText}`);
		return;
	}

	let city = address.split(',')[0].trim().toLowerCase()
		.replace(/[^\x20-\x7E]+/g, "")
		.replace("  ", " ")
		.replace(" \'", "\'")
		.replace('\\\'', '\'')
		.replace('st ', 'st. ')
		.replace('mt ', 'mt. ')
		.replace('hr.', 'harbour')
		.replace('john s', 'john\'s')
		.replace('johns\'', 'john\'s')
		.replace('johns', 'john\'s')
	;

	if (skip.includes(city)) {
		return;
	}

	while (replacement_map[city] !== undefined) {
		city = replacement_map[city];
	}

	if (city.includes("portugal cove") || city.includes("st. philip") || city.includes("st. phillip")) {
		city = "Portugal Cove - St. Philips";
	}

	if (city.includes("petty harbour") || city.includes("maddox cove")) {
		city = "Petty Harbour - Maddox Cove";
	}

	if (city.includes("logy bay") || city.includes("middle cove") || city.includes("outer cove")) {
		city = "Logy Bay - Middle Cove - Outer Cove";
	}

	city = toTitleCase(city);

	if (postalCodes[postalCode][city] === undefined) {
		postalCodes[postalCode][city] = new Set();
	}
	postalCodes[postalCode][city].add(result.MlsNumber);
});

let mapping = [];

for (let postal of Object.keys(postalCodes).sort()) {
	let location = '';
	if (verified[postal] !== undefined) {
		location = verified[postal];
	}
	else {
		let cities = postalCodes[postal];

		if (Object.keys(cities).length > 1) {
			let total = 0;
			let max_city = '';
			let max_city_count = 0;
			for (let city in cities) {
				total += cities[city].size;
				if (cities[city].size > max_city_count) {
					max_city_count = cities[city].size;
					max_city = city;
				}
			}
			if ((max_city_count / total) < 0.6) {
				location = `(Uncertain) ${max_city}`;
				console.error(postal, location);
			}
			else {
				location = max_city;
			}
		}
		else {
			location = Object.keys(cities)[0];
		}
	}
	mapping.push({'Postal Code': postal, "Location": location});
}

console.log(json2csv({data: mapping, del: '\t'}));

// console.log([...testing.values()].sort());
// console.error(postalCodes);
