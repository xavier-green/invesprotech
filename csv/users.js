let fs = require("fs"),
	axios = require("axios"),
	bluebird = require("bluebird");

global.i = 0;
var headers = [];

const protections = [20,30,40,50,60,70,80,90,100]
const fiscalTypes = ["PERP","Assurance Vie","Compte titre"]
const userObjects = []

var lineReader = require('readline').createInterface({
  input: fs.createReadStream('test_users.csv')
});

function saveUsers() {
	return bluebird.mapSeries(userObjects, (userObject) => {
		return axios.post('http://localhost:3000/register',userObject)
		.catch((err) => console.log(err))
	})
}

lineReader.on('line', function (line) {
	if (global.i==0) {
		headers = line.split(",").map((el) => { return el.trim().toLowerCase()})
		console.log(headers);
	} else {
		let entry = line.split(",")
		var userObject = {
			protection: protections[global.i%9],
			fiscal_type: fiscalTypes[global.i%3],
			password: "milvus"
		}
		for (var j = 0; j < entry.length; j++) {
			userObject[headers[j]] = entry[j]
		}
		// userObjects.push(userObject)
		axios.post('http://localhost:3000/register',userObject)
		.catch((err) => console.log(err))
	}
	global.i += 1
});

lineReader.on('close',function(){
    console.log('***************completed');
    // saveUsers()
});