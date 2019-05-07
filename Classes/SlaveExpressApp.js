const express = require('express');

class SlaveExpressApp {

	constructor() {
		this._app = express();
		this._app.get('/slave', (req, res, next) => {
			res.send("I'm a slave !");
		});
		return this._app;
	}

}

module.exports = SlaveExpressApp;