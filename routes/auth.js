exports.login = function (req, res, next) {
  console.log("Login Authentication");
  if (req.session.email) {
    next();
      console.log("Login Authentication Success");
  } else {
    res.redirect('/login');
      console.log("Login Authentication Fail");
  }
};