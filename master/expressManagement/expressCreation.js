const http = require('http');
const express = require('express');
let createError = require('http-errors');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let SwaggerParser = require('swagger-parser');

let createApp = () => {
	let app = express();

	app.use(express.json());
	app.use(logger('dev'));
	app.use(express.urlencoded({extended: false}));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'pug');
	return app;
};

let createHTTPServer = (app) => {
	return http.createServer(app);
};

let launchHTTPServer = (httpServer, port) => {
	httpServer.listen(port, () => console.log("HTTPServer listening on " + port + " for App"));
};

module.exports = {
	createApp: createApp,
	createHTTPServer: createHTTPServer,
	launchHTTPServer: launchHTTPServer,
};
