let fs = require("fs"),
	Strategie = require("./../server/models/strategies"),
	mongoClient = require('mongodb').MongoClient;

global.i = 0;
var headers = [];
let url = "mongodb://localhost:27017/test";

mongoClient.connect(url,function(err,db){
    if(err){
        console.log('error on connection '+err);
    } else {
    	let collection  = db.collection("strategies");

    	var lineReader = require('readline').createInterface({
		  input: fs.createReadStream('stats_fixed.csv')
		});

    	lineReader.on('line', function (line) {
			if (global.i==0) {
				headers = line.split(";").map((el) => { return el.trim().toLowerCase()})
				global.i += 1
				console.log(headers);
			} else {
				let entry = line.split(";").map((el,i) => {
					if (i==1) {
						return el;
					} 
					return +(el.replace(",","."))
				})
				var stratObject = {}
				var univObject = {}
				for (var i = 0; i < 4; i++) {
					stratObject[headers[i]] = entry[i]
				}
				for (var i = 4; i < entry.length; i++) {
					univObject[headers[i]] = entry[i]
				}
				stratObject.univers_object = univObject
				collection.insert(stratObject, function (insertErr, insertObj) {
                    if (insertErr) console.error(insertErr)
                })
			}
		});

		lineReader.on('close',function(){
            db.close();
            console.log('***************completed');
        });
    }
})