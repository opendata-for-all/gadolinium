const express = require('express');

class SocketServerExpressApp {

	constructor() {
		this._app = express();
		this._app.get('/slave', (req, res, next) => {
			res.send("I'm a slave !");
		});
		return this._app;
	}

}

module.exports = SocketServerExpressApp;