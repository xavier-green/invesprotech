'use strict';

let bluebird = require("bluebird"),
	fs = require("fs");

const pending_transactions = require('./../models/pending_transactions');
const treated_transactions = require('./../models/treated_transactions');
var moment = require('moment');

var treated_transactions_file = "user_id;portfolio_id;transaction_group_id;quantity;deposit_type;protection;status;treated_date\n"

function writeToFile(obj) {

	treated_transactions_file += obj.user_id+";"+obj.portfolio_id._id+";"+obj.group_id+";"+obj.quantity+";"+obj.deposit_type+";"+obj.universe.protection+";"+obj.status+"\n";

}

const todayDate = moment().format("DD/MM/YYYY")

exports.getPendingTransactions = (req, res, next) => {

	// var password = req.params['0'] || null;

	// if (password == "milvus2017@1") {

		console.log("getting data");
		return pending_transactions.findAsync()
		.then((transactions) => {
			return bluebird.mapSeries(transactions, (pending_transaction) => {

				let depositType = pending_transaction.deposit_type
				let saveTransaction = false
				let toDelete = false
				let nextDepositDate = ""

				if (depositType !== "ponctuel" && pending_transaction.recurrency.start == todayDate) {

					let recurrentType = pending_transaction.recurrency.type
					let startDate = moment(pending_transaction.recurrency.start, "DD/MM/YYYY")
					let addObject = {}

					if (recurrentType == "monthly") {
						addObject = {
							months: 1
						}
					} else if (recurrentType == "weekly") {
						addObject = {
							weeks: 1
						}
					} else if (recurrentType == "daily") {
						addObject = {
							days: 1
						}
					}

					nextDepositDate = startDate.add(addObject).format("DD/MM/YYYY")

					console.log("updating the transaction to the next recurrent date: "+nextDepositDate);

					saveTransaction = true

				} else if (depositType == "ponctuel") {

					console.log("deposit ponctuel, safe to delete");
					saveTransaction = true
					toDelete = true

				}

				if (saveTransaction) {

					let new_treated_transaction_object = {
						user_id : pending_transaction.user_id,
						portfolio_id : pending_transaction.portfolio_id,
						transaction_id : pending_transaction.transaction_id,
						quantity : pending_transaction.quantity,
						deposit_type : pending_transaction.deposit_type,
						universe : pending_transaction.universe,
						status : "pending"
					}

					let new_treated_transaction = new treated_transactions(new_treated_transaction_object)

					return new_treated_transaction.saveAsync()
					.then((new_transaction) => {

						if (toDelete) {

							console.log("deleting old transaction");
							console.log(new_transaction);
							// return pending_transactions.removeAsync({_id:pending_transaction._id})
							// .then(() => {

								writeToFile(new_transaction)

							// })

						} else {

							console.log("updating new transaction with recurrent date "+nextDepositDate);
							return pending_transactions.update({_id:pending_transaction._id},{$set:{"recurrency.start":nextDepositDate}}).execAsync()
							.then(() => {

								writeToFile(new_transaction)

							})

						}

					})

				}

			})
			.then(() => {

				let filePath = __dirname+'/treated_transactions.csv'

				fs.writeFile(filePath, treated_transactions_file, (err) => {
				  if (err) throw err;
				  console.log('It\'s saved!');
				  res.sendFile(filePath,"treated_transactions.csv")
				});

			})
		})
		.catch((err) => {
			console.log(err);
		})

	// } else {

	// 	res.status(404).send();

	// }

}