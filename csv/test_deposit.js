let fs = require("fs"),
	axios = require("axios"),
	bluebird = require("bluebird");

global.i = 0;
var headers = [];

const protections = [2000,3000,4000,5000,6000,7000,8000,9000,10000]
const userObjects = []

var lineReader = require('readline').createInterface({
  input: fs.createReadStream('test_portfolios.csv')
});

lineReader.on('line', function (line) {
	if (global.i==0) {
		headers = line.split(",").map((el) => { return el.trim().toLowerCase()})
		console.log(headers);
	} else {
		let entry = line.split(",")
		var depositObject = {
			amount: protections[global.i%9],
			deposit_type: "ponctuel"
		}
		for (var j = 0; j < entry.length; j++) {
			depositObject[headers[j]] = entry[j]
		}
		// userObjects.push(userObject)
		// axios.post('http://ec2-35-167-112-99.us-west-2.compute.amazonaws.com:3000/changefunds/',depositObject)
		axios.post('http://localhost:3000/changefunds/',depositObject)
		.catch((err) => console.log(err))
	}
	global.i += 1
});

lineReader.on('close',function(){
    console.log('***************completed');
    // saveUsers()
});