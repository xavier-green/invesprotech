//Ceci est pour savoir si on est en mode développement ou bien en mode production
var dotenv = require('dotenv');
if (process.env.NODE_ENV) {
  dotenv.load({ path: '.env.'+process.env.NODE_ENV });
} else {
  dotenv.load({ path: __dirname+'/.env.development' });
}

console.log('Loaded env:', process.env.LOADED_FILE);
console.log(process.env.PORT);

var express = require('express'),
    exphbs = require('express-handlebars'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    passport = require('passport'),
    mongoose = require("mongoose"),
    path = require("path");

var app = express();

//On se connecte à mongo, sur l'url définie dans les fichiers .env
mongoose.connect(process.env.MONGOURL);
mongoose.connection.on('error', function(err) {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.', err);
  process.exit(1);
});

// Set up de express (framework backend) avec logger
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('X-HTTP-Method-Override'));
// On save une session par utilisateur, avec un cookie qui dure 10j
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: true,
  cookie: {
   maxAge: (60 * 60 * 24 * 10 * 1000),
   httpOnly: false
  },
}));
// Pour passer les variables entre sessions
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;
  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;
  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;
  next();
});
app.use(passport.initialize());
app.use(passport.session());
const localSignupStrategy = require('./server/security/passport-local-signup');
passport.use('local-signup', localSignupStrategy);
const localSigninStrategy = require('./server/security/passport-local-signin');
passport.use('local-signin', localSigninStrategy);

// Pour gérer les pages statiques
app.use('/', express.static(path.join(__dirname, 'website')));
app.use('/assets', express.static(path.join(__dirname, 'public/views/assets')));
app.set('views', path.join(__dirname, 'public/views'));
var hbs = exphbs.create({
    defaultLayout: 'dashboard',
    layoutsDir:'public/views/layouts'
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Intermediaire pour gérer l'authentification
function ensureAuthenticated(req, res, next) {
  if (req.session.user) { return next(); }
  req.session.error = 'Veuillez vous connecter !';
  res.redirect('/login');
}

// Routes pour authentification et l'api
const authRoutes = require('./server/routes/auth');
app.use('/', authRoutes);
const apiRoutes = require('./server/routes/api');
app.use('/api', ensureAuthenticated, apiRoutes);
const staticRoutes = require('./server/routes/static');
app.use('/app', ensureAuthenticated, staticRoutes);


// Lancement du serveur
app.listen(process.env.PORT, function() {
  console.log('Express server listening on port %d in %s mode', process.env.PORT, app.get('env'));
});
