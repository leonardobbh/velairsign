var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');

var indexRouter = require('./routes/index');
var alunoRouter = require('./routes/aluno');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
app.disable('x-powered-by');


app.use(function(err, req, res, next) {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        res.status(400).json({ code: 400, message: "bad request" });
    } else next();
});

app.use('/', indexRouter);
app.use('/aluno', alunoRouter);

app.use(function(req, res, next){
    res.status(404).json({ error: '404 - Request Not found' });
});

module.exports = app;
