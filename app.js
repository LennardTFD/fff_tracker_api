var createError = require('http-errors');
var express = require('express');
const { check, validationResult, sanitizeBody } = require('express-validator');
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var fs = require("fs");
var Cache = require("./Classes/Cache");
let cache = new Cache();

const {CONFIG} = require("./Constants");


//var http = require('http');
var app = express();

const https = require("https");

const secureServer = https.createServer({

  key: fs.readFileSync("certificates/server.key"),

  cert: fs.readFileSync("certificates/server.cert")

}, app);

//var server = http.createServer(app);
//let io = require("socket.io").listen(app.listen(3000));
let io = require("socket.io")(secureServer);

io.sockets.on("connection", (socket) => {
  console.log("CONNECTION");
});

var apiRouter = require('./routes/api')(app, io, cache);
//var apiRouter = require('./routes/api');
var routeRouter = require('./routes/route')(cache);
//var marchRouter = require('./routes/march')(app, io, cache);
var marchRouter = require('./routes/march')(cache);
//var testRouter = require('./routes/test')(app, io);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false
}));

app.use(function(req, res, next) {
  console.log("SANITIZING!");
  console.log(req.body);
  for (var item in req.body) {
    console.log(req.body[item]);
    req.body[item] = req.body[item].replace(/<br>/gi, "$LINEBREAK$");
    console.log(req.body[item]);
    req.body[item] = req.body[item].replace(/<|>|onerror|onload|javascript:|onmouseover|/gi, "");
    req.body[item] = req.body[item].replace(/\$LINEBREAK\$/g, "<br>");
    //req.body[item] = req.body[item].replace(/\\n/g, "<br>");
    console.log(req.body[item]);
  }
  next();
});


app.get('/login', function(req, res, next) {
  res.render("login");
});

app.post('/login', function(req, res, next) {
  if(req.body.password == CONFIG.LOGINPASSWORD)
  {
    req.session.loggedin = true;
    res.send("Eingelogged <a href='/'>Return to Start</a>");
  }
  else {
    res.send("Falsches Passwort <a href='/login'>Zurück</a>");
  }
});

app.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

function requiresLogin(req, res, next) {
  if ((req.session && req.session.loggedin) || req.body.password == CONFIG.LOGINPASSWORD || req.query.password == CONFIG.LOGINPASSWORD) {
    console.log(req.session);
    return next();
  } else {

    return res.send("You are not logged in!<a href='/'>Return to Start</a>");
  }
}

app.get('/io', (req, res, next) => {res.sendFile(path.join(__dirname, "/node_modules/socket.io-client/dist/socket.io.min.js"))});
app.use('/api', apiRouter);
app.use('/route', requiresLogin, routeRouter);
app.use('/march', requiresLogin, marchRouter);
//app.use('/test', testRouter);
app.use('/', (req, res, next) => {
  res.render("index", {loggedin: req.session.loggedin});
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//server.listen(3000);
secureServer.listen(2050, () => {

  console.log("secure server started at 2050");

});
module.exports = app;
