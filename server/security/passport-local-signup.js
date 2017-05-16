var LocalStrategy = require('passport-local').Strategy,
    userController = require('./../controllers/user');

module.exports = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback : true
  }, (req, email, password, done) => {
    var data = req.body;
    userController.registerAccount(data)
    .then((user) => {
      console.log("Nouvelle creation de compte de "+user.email);
      req.session.success = 'You are successfully registered and logged in ' + user.profile.first_name + '!';
      req.session.user = user;
      return done(user);
    })
    .catch((err) => {
      req.session.error = err;
      return done(null)
    });
  }
);
