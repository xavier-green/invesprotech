const express = require('express');
const userController = require('./../controllers/user');
const portfolioController = require('./../controllers/portfolio');
const historyController = require('./../controllers/history');

const router = new express.Router();

router.get('/', (req,res,next) => {
  res.status(200).json(req.session.user)
})

router.post('/changefunds', portfolioController.changeFunds);

router.post('/changeprotection', portfolioController.changeProtection);

router.post('/changeuniverse', portfolioController.changeUniverse);

router.post('/faketoreal', userController.faketoreal)

router.post('/addportfolio/:returnpage', userController.addNewPortfolio)

router.post('/addbank', userController.addBank)

router.post('/changeprotection', portfolioController.changeProtection)

router.post('/portfoliodata', portfolioController.portfolioData)

router.post('/universedata', portfolioController.getUniverse)

router.post('/expositions', portfolioController.expositions)

router.post('/portfolio_history', historyController.portfolioHistory)

router.post('/portfolio_history_index', historyController.portfolioIndexHistory)

router.post('/addlegal', userController.addLegal)

module.exports = router;
