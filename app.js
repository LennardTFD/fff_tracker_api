var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


//var http = require('http');
var app = express();

//var server = http.createServer(app);
let io = require("socket.io").listen(app.listen(3000));

io.sockets.on("connection", (socket) => {
  console.log("CONNECTION");
});

var apiRouter = require('./routes/api')(app, io);
//var apiRouter = require('./routes/api');
var adminRouter = require('./routes/admin');
//var testRouter = require('./routes/test')(app, io);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/io', (req, res, next) => {res.sendFile(path.join(__dirname, "/node_modules/socket.io-client/dist/socket.io.js"))});
app.use('/api', apiRouter);
app.use('/admin', adminRouter);
//app.use('/test', testRouter);
app.use('/', (req, res, next) => {
  res.render("index");
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

module.exports = app;
