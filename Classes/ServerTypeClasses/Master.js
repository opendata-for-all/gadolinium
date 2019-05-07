const express = require('express');
const MasterExpressApp = require('../MasterExpressApp');

class Master {
	constructor(configFile) {
		this._ipaddress = configFile._ipaddress;
		this._slaves = configFile.slaves;
		this._connectedSlaves = [];
		this._socketServer = null;
		this._app = null;
		this._httpServer = null;
		configFile.httpServer.type = "master";
		this._socketServer = null;
	}

	createSlaveSocketChannels() {
		// this._socketServer.createSecurityMiddleware(this._slaves);
		this._socketServer.createChannel(this._slaves);
	}

	newSlaveConnected(slave) {
		this._connectedSlaves.push(slave);
	}

	sendNewAPIToTest(api){
		this._connectedSlaves.forEach((slave) => {
			slave.client.emit('new api', api);
			slave.createNewAPITest(api.id);
		})
	}

	retrieveDataFromChannel(data) {
		console.log(data);
	}

	setApp(app) {
		this._app = app;
	}

	get app() {
		return this._app;
	}

	setHTTPServer(httpServer) {
		this._httpServer = httpServer;
	}

	get httpServer() {
		return this._httpServer;
	}

	setSocketServer(socketServer) {
		this._socketServer = socketServer;
	}

	get socketServer() {
		return this._socketServer;
	}


	get ipaddress() {
		return this._ipaddress;
	}

	set ipaddress(value) {
		this._ipaddress = value;
	}

	get slaves() {
		return this._slaves;
	}

	set slaves(value) {
		this._slaves = value;
	}
}


module.exports = Master;