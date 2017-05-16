var LocalStrategy = require('passport-local').Strategy,
    userController = require('./../controllers/user');

module.exports = new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  session: false,
  passReqToCallback: true
}, (req, email, password, done) => {
  return userController.loginAccount(email, password)
  .then((user) => {
    console.log("Nouvelle connexion de "+user.email);
    req.session.success = 'You are successfully logged in ' + user.profile.first_name + '!';
    req.session.user = user;
    done(user)
  })
  .catch((err) => {
    req.session.error = err;
    done(null)
  })
});
