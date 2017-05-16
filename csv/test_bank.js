let fs = require("fs"),
	axios = require("axios"),
	bluebird = require("bluebird");

global.i = 0;
var headers = [];
const fiscalTypes = ["Credit Agricole","LCL","HSBC"]
const userObjects = []

var lineReader = require('readline').createInterface({
  input: fs.createReadStream('test_bank.csv')
});

lineReader.on('line', function (line) {
	if (global.i==0) {
		headers = line.split(",").map((el) => { return el.trim().toLowerCase()})
		console.log(headers);
	} else {
		let entry = line.split(",")
		var bankObject = {
			bank: fiscalTypes[global.i%3],
			iban: "1234 1234 1234 1234",
			swift: "1234567890"
		}
		for (var j = 0; j < entry.length; j++) {
			bankObject[headers[j]] = entry[j]
		}
		// userObjects.push(userObject)
		// axios.post('http://ec2-35-167-112-99.us-west-2.compute.amazonaws.com:3000/addbank/',bankObject)
		axios.post('http://localhost:3000/addbank/',bankObject)
		.catch((err) => console.log(err))
	}
	global.i += 1
});

lineReader.on('close',function(){
    console.log('***************completed');
    // saveUsers()
});