const express = require('express');
const http = require('http');
const MasterApp = require('./MasterExpressApp');
const SlaveApp = require('./SlaveExpressApp');
const SocketServerApp = require('./SocketServerExpressApp');

class HTTPServer{

	constructor(config, app) {
		this._port = config.port;
		this._httpServer = null;
		this._app = app;
		this._type = config.type;
		this.createHTTPServer();
	}

	setExpressApp(app) {
		this._app = app;
	}

	createHTTPServer() {
		if(this._app.app !== null) this._httpServer = http.createServer(this._app.app);
		else new Error("App is not initiated");
	}

	launchServer(){
		this._httpServer.listen(this._port, () => console.log("HTTPServer listening on " + this._port + " for " + this._type));
	}

	get port() {
		return this._port;
	}

	set port(value) {
		this._port = value;
	}

	get httpServer() {
		return this._httpServer;
	}

	set httpServer(value) {
		this._httpServer = value;
	}

	set app(value) {
		this._app = value;
	}
}

module.exports = HTTPServer;