const http = require('http');
const express = require('express');
let createError = require('http-errors');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let SwaggerParser = require('swagger-parser');

let createApp = () => {
	let app = express();

	app.use(function (req, res, next) {
		//Enabling CORS
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization');
		next();
	});
	app.use(express.json());
	app.use(logger('dev'));
	app.use(express.urlencoded({extended: false}));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public/dist/front-end')));
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
