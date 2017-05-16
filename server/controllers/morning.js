'use strict';

let bluebird = require("bluebird"),
	fs = require("fs"),
	Strat = require("./../models/strategies"),
	updatePortfolio = require("./portfolio").updateNetAssetValue,
	Portfolio = require("./../models/portfolio"),
	History = require("./../models/portfolio_history");

const treated_transactions = require('./../models/treated_transactions');
var moment = require('moment');

var i = 0;

const filePath = __dirname+"/../uploads/treated_transactions.csv"
const today = moment().format("DD/MM/YYYY")

function getColumns(lineSplit) {

	let columnsObject = {
		user_id : lineSplit[0],
		portfolio_id : lineSplit[1],
		transaction_group_id : lineSplit[2],
		quantity : lineSplit[3],
		deposit_type : lineSplit[4],
		protection : lineSplit[5],
		status : lineSplit[6]
	}

	if (lineSplit.length > 7) {
		columnsObject.treated_date = lineSplit[7]
	}

	return columnsObject

}

function updateTreatedTransactions(treated_transactions_to_update,req, res, next){

	console.log("Updating the right transactions");

	let portfoliosToUpdate = []
	let quantities = []
	let treatedDates = []

	return bluebird.mapSeries(treated_transactions_to_update, (transaction) => {

		if(!isNaN(transaction.transaction_group_id)){

			console.log("finding treated transaction with group_id="+transaction.transaction_group_id);
			return treated_transactions.findAsync({group_id:transaction.transaction_group_id})
			.then((transactions_to_update) => {

				return bluebird.mapSeries(transactions_to_update, (transaction_to_update) => {

					if (transaction.treated_date && (transaction.treated_date !== '')) {
						console.log(transaction.treated_date);
						let tindex = portfoliosToUpdate.indexOf(transaction_to_update.portfolio_id._id)
						if (tindex == (-1)) {
							portfoliosToUpdate.push(transaction_to_update.portfolio_id._id)
							quantities.push(transaction_to_update.quantity)
							treatedDates.push(transaction.treated_date)
						} else {
							quantities[tindex] += transaction_to_update.quantity
						}
						transaction_to_update.status = transaction.status;
						transaction_to_update.treated_date = moment(transaction.treated_date,"DD/MM/YYYY").unix(); //to come back: moment.unix(1494540000).format("DD/MM/YYYY")
						return transaction_to_update.saveAsync()
					}

				})

			})

		}

	})
	.then(() => {
		return updatePortfolios(portfoliosToUpdate, quantities, treatedDates, req, res, next)
	})
	.catch((err) => {
		console.log(err);
	})

}

function updatePortfolios(portfoliosUpdateQuantity, quantities, treatedDates, req, res, next){
	//change net_asset_value
	// add value to portfolio history

	console.log("updating portfolios at date: "+today);
	console.log("portfolios with updated quantities:");
	console.log(portfoliosUpdateQuantity);

	return Portfolio.findAsync()
	.then((portfoliosToUpdate) => {

		console.log("Found "+portfoliosToUpdate.length+" to update !");

		return bluebird.mapSeries(portfoliosToUpdate, (portfolio) => {

			let dateOfProcessing = today
			let quantity = 0
			if (portfoliosUpdateQuantity.indexOf(portfolio._id) !== (-1)) {
				const index = portfoliosUpdateQuantity.indexOf(portfolio._id)
				quantity = quantities[index]
				dateOfProcessing = treatedDates[index]
				console.log("Portfolio needs a quantity update, quantity="+quantity+", date="+dateOfProcessing);
			}

			console.log("updating portfolio "+portfolio._id);
			console.log("looking for strat with object:");
			let searchObject = {date:dateOfProcessing,protection:portfolio.protection_level}
			console.log(searchObject);

			return Strat.find(searchObject).limit(1).execAsync()
			.then((strategie) => {

				console.log("Looking for rendement: date="+dateOfProcessing+" ;protection="+portfolio.protection_level);
				const protec = portfolio.protection_level/100;

				if (strategie.length > 0) {

					console.log("Found a strategy");

					const rendement = parseFloat(strategie[0].rendement)
					console.log("Rendement="+rendement);
					const old_val_r = (1+rendement)*portfolio.net_asset_value
					const new_asset_value = old_val_r+quantity
					const new_deposit_value = portfolio.deposit_amount+quantity
					const new_net_asset_value_protected = Math.max(old_val_r*protec,portfolio.net_asset_value_protected)+quantity*protec
					console.log("*********");
					console.log("update:");
					console.log("old_value="+portfolio.net_asset_value);
					console.log("new_value="+new_asset_value);
					console.log("*********");
					portfolio.net_asset_value = new_asset_value
					portfolio.deposit_amount = new_deposit_value
					portfolio.net_asset_value_protected = new_net_asset_value_protected
					return portfolio.saveAsync()
					.then((portf) => { //Log portfolio change

						console.log("new portfolio:");
						console.log(portf);

						console.log("getting last protected value");
						return History.find({portfolio_id:portf._id}).sort({date:-1}).limit(1).execAsync()
						.then((lastHistoricValue) => {
							
							let protected_value = parseFloat(portf.net_asset_value)*parseFloat(portf.protection_level)/100
							console.log("setting default protection to "+protected_value);

							if (lastHistoricValue.length>0) {

								const lastProtectedValue = lastHistoricValue[0].protected_value
								let protected_value = Math.max(lastProtectedValue,portf.net_asset_value*portf.protected_value/100);

							}

							console.log("Now logging the portfolio change");
							let historyObject = {
								user_id : portf.user_id,
							    portfolio_id : portf._id,
							    date : dateOfProcessing,
							    net_asset_value : portf.net_asset_value,
							    protected_value : protected_value
							}
							console.log(historyObject);

							let history = new History(historyObject)

							return history.saveAsync()

						})

					})

				} else {

					console.log("No rendement found for this date and protection level");

				}

			})

		})

	})
	.then(() => {
		fs.unlink(filePath, () => {
			res.json({okay:true})
		})
	})
	.catch((err) => {
		res.json(err)
	})
}

exports.getTreatedTransactions = (req, res, next) => {

	var password = req.params['0'] || null;

	if (password == "milvus2017@1") {

		console.log("getting data");
		let treated_transactions_to_update = []

		var lineReader = require('readline').createInterface({
		  input: fs.createReadStream(filePath)
		});
		
		lineReader.on('line', function (line) {
			if (i == 0) {
				i++;
			} else {

				let lineSplit = line.split(";")

				let columnsObject = getColumns(lineSplit)

				treated_transactions_to_update.push(columnsObject)

			}
		});

		lineReader.on('close',function(){
	        console.log('*************** Extraction from csv completed');
	        updateTreatedTransactions(treated_transactions_to_update,req, res, next)
	    });

	} else {

		res.status(404).send()

	}

}





