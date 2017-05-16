const express = require('express');
const passport = require('passport');
const userController = require("./../controllers/user");
const portfolioController = require("./../controllers/portfolio");
const historyController = require("./../controllers/history");
let ttransactionController = require("./../controllers/treated");
let morningController = require("./../controllers/morning");
let morningManualController = require("./../controllers/morning_manual");
var exec = require('child_process').exec;
var path = require('path')
var fs = require("fs");
var bluebird = require("bluebird");
var renameAsync = bluebird.promisify(fs.rename);

var multer = require("multer");
var upload = multer({ dest: __dirname+'/../../scripts/' });

const router = new express.Router();

router.get('/pending_transactions', ttransactionController.getPendingTransactions);

router.get('/morning/*', morningController.getTreatedTransactions);

router.get('/morning_manual/*', morningManualController.getTreatedTransactions);

router.post('/addportfolio', userController.testPortfolios);

router.post('/addbank', userController.addBankTest)

router.get('/users/milvus2017@1', userController.getUsers)

router.post('/changefunds', portfolioController.changeFundsTest);

router.get('/', (req,res) => {
  res.redirect('/app')
})

router.get('/login', (req,res) => {
  res.render('start', {layout:'login'});
})

router.get('/oubli', (req,res) => {
  res.render('forgot', {layout:'login'});
})

router.get('/register', (req,res) => {
  res.render('register', {layout:'register'});
})

router.post('/simulationdata', historyController.simulationData)

router.get('/verify/*', userController.verifyAccount);

router.get('/reset', userController.resetAccount);

router.post('/reset', userController.checkResetAccount);

//router.post('/checkemail', userController.checkEmail);

router.post('/register', (req,res,next) => {
  console.log("Got register");
  return passport.authenticate('local-signup', (nUser) => {
    res.redirect("/app/bienvenue")
  })(req, res, next)
})

router.post('/login', (req,res,next) => {
  return passport.authenticate('local-signin', (nUser) => {
    if (nUser == null) {
      res.render('start', {layout:'login',err:"Erreur d'authentification"});
    } else {
      res.redirect('/app');
    }
  })(req, res, next)
});

router.post('/forgot',userController.forgotAccount);

router.get('/logout', function(req, res){
  var name = req.session.user.profile.first_name;
  req.logout();
  res.redirect('/login');
  req.session.notice = name+", nous avons bien reussi à vous déconnecter!";
});

router.get('/getallusers', (req,res)=>{
  console.log("here");
  var cmd = 'cd scripts; ./export.sh -u-all';
  exec(cmd, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
    var filePath = __dirname+'/../../scripts/users.csv';
    res.download(filePath); 
  });
})

router.get('/userslastexport', (req,res)=>{
  console.log("here");
  var cmd = 'cd scripts; ./export.sh -u';
  exec(cmd, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
    var filePath = __dirname+'/../../scripts/users.csv';
    res.download(filePath); 
  });
})

router.get('/getallportfolios', (req,res)=>{
  console.log("here");
  var cmd = 'cd scripts; ./export.sh -p';
  exec(cmd, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
    var filePath = __dirname+'/../../scripts/portfolios.csv';
    res.download(filePath); 
  });
})

router.get('/getallpt', (req,res)=>{
  console.log("here");
  var cmd = 'cd scripts; ./export.sh -pt';
  exec(cmd, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
    var filePath = __dirname+'/../../scripts/pending_transactions.csv';
    res.download(filePath); 
  });
})

router.get('/getalltt', (req,res)=>{
  console.log("here");
  var cmd = 'cd scripts; ./export.sh -tt-all';
  exec(cmd, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
    var filePath = __dirname+'/../../scripts/treated_transactions.csv';
    res.download(filePath); 
  });
})

router.get('/ttdate/:date', (req,res)=>{
  var spl = req.param('date').split('_');
  var cmd = 'cd scripts; ./export.sh -tt-all';
  if (spl[0] !== '') {
    if (spl[1] !== '') {
      cmd = 'cd scripts; ./export.sh -tt-sedate "'+spl[0]+'" "'+spl[1]+'"';
    } else {
      cmd = 'cd scripts; ./export.sh -tt-sdate "'+spl[0]+'"';
    }
  } else if (spl[1] !== '') {
    cmd = 'cd scripts; ./export.sh -tt-edate "'+spl[0]+'"';
  }
  exec(cmd, function(error, stdout, stderr) {
    console.log(error);
    console.log(stdout);
    console.log(stderr);
    var filePath = __dirname+'/../../scripts/treated_transactions.csv';
    res.download(filePath); 
  });
})

router.post('/fileupload', upload.array('file',2), (req,res,next) => {
  //console.log(req);
  var uploadDir = path.join(__dirname,'/../uploads/');
  var files = req.files;
  console.log(files);
  bluebird.map(files, (file, i) => {
    return renameAsync(file.path, path.join(uploadDir,file.originalname));
  })
  .then(() => {
    res.json({success: true})
  })
  .catch((err) => {
    console.log(err);
    res.json({success: false});
  })
});

module.exports = router;
