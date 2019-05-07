const express = require('express');
const OpenAPIJSONParser = require('./Parsers/OpenAPIJSONParser');

class MasterExpressApp{

	constructor(master) {
		this._master = master;
		this._app = express();
		this._app.use(express.json());
		this.createDefaultEndpoint();
		this.createSocketStatusEndpoint();
		this.createJSONInputEndpoint();
	}

	createSocketStatusEndpoint(){
		this._app.get('/socketStatus', (req, res, next) => {
			let status = false;
			if(this._master.socketServer){
				status = this._master.socketServer.isOn;
			}
			res.send(status);
		})
	}

	createDefaultEndpoint(){
		this._app.get('/master', (req, res, next) => {
			res.send("I'm a master !");
		});
	}

	createJSONInputEndpoint(){
		this._app.post('/OpenAPI', (req, res, next) => {
			let newApi = {};
			let openAPIJSON = req.body;
			let httpRequest = OpenAPIJSONParser.parse(openAPIJSON);
			newApi.id = 0;
			newApi.host = openAPIJSON.host;
			newApi.httpRequests = httpRequest;
			this._master.sendNewAPIToTest(newApi);
			res.sendStatus(200);
		})
	}

	get app() {
		return this._app;
	}
}

module.exports = MasterExpressApp;