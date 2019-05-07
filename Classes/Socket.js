const HTTPServer = require('./HTTPServer');
const WebSocketServer = require('socket.io');
const SocketServerExpressApp = require('./SocketServerExpressApp');
const SlaveClient = require('./SlaveClient');
const io = require('socket.io-client');

class SocketServer {

	constructor(config, master) {
		this._master = master;
		this._port = config.port;
		//TODO Determiner le paramètre originAllowed (fonction ? liste des slaves avec leur IP ?)
		this._originAllowed = config.originAllowed;
		this._app = new SocketServerExpressApp();
		this._httpServer = new HTTPServer({port: this._port, type: "socket"}, this._app);
		this._socketServer = null;
		this._connectedSlaves = {};
		this._isOn = false;
	}

	launchServer() {
		this.createSocketServer();
	}

	createSocketServer() {
		this._httpServer.launchServer();
		this._socketServer = new WebSocketServer(this._httpServer.httpServer);
		// this._socketServer.on('connection', client => {
		// 	console.log("Client connected");
		// 	client.on('event', data => {
		// 		console.log(data);
		// 	});
		// 	client.on('disconnect', () => {
		// 		console.log("user disconnected");
		// 	});
		// });
		console.log("Websocket server created on " + this._httpServer.port);
		this._isOn = true;
	}

	createChannel(slaves) {
		this._socketServer.on('connection', (client) => {
			let authorized = false;
			let authorizedSlave;
			for (let slave of slaves) {
				if (slave.region === client.handshake.query.region && slave.token === client.handshake.query.token) {
					authorized = true;
					authorizedSlave = slave;
				}
			}
			if (authorized) {
				console.log("Slave " + authorizedSlave.region + " connected");
				client.emit("welcome", "Hello slave " + authorizedSlave.region);
				let connectedSlave = new SlaveClient(client, this._master, authorizedSlave);
				this._master.newSlaveConnected(connectedSlave);
			} else {
				console.log("User unauthorized to connect");
				client.disconnect();
			}
		});
	}

	//TODO Securité de connexion
	// createSecurityMiddleware(slaves){
	// 	this._socketServer.use((socket, next) => {
	// 		let clientToken = socket.handshake.query.token;
	// 		for(let slave of slaves){
	// 			if(slave.token === clientToken) {
	// 				console.log("connection accepted normally")
	// 				return next();
	// 			}
	// 		}
	// 		return next(new Error('authentication error'));
	// 	});
	// }

	get port() {
		return this._port;
	}

	set port(value) {
		this._port = value;
	}

	get originAllowed() {
		return this._originAllowed;
	}

	set originAllowed(value) {
		this._originAllowed = value;
	}

	get httpServer() {
		return this._httpServer;
	}

	set httpServer(value) {
		this._httpServer = value;
	}

	get webSocketServer() {
		return this._socketServer;
	}

	set webSocketServer(value) {
		this._socketServer = value;
	}

	get isOn() {
		return this._isOn;
	}

	set isOn(value) {
		this._isOn = value;
	}
}

class SocketClient {

	constructor(masterInfo, region, token) {
		this._socketClient = io(`ws://${masterInfo.ipaddress}:${masterInfo.port}`, {
			query: {
				region: region,
				token: token
			}
		});

		this._socketClient.on('connect', () => {
			console.log("Connected to Master");
		});

		this._socketClient.on('disconnect', () => {
			console.log("Disconnected from Master... Trying to reconnect");
			let timeout = 3000;
			let interval = setInterval(() => {
				this._socketClient.connect();
				if (this._socketClient.connected) {
					clearInterval(interval);
				} else {
					console.log("Couldn't reconnect to Master, retrying in " + timeout / 1000 + " seconds.")
				}
			}, timeout);
		});
	}

	send(channel, data) {
		this._socketClient.emit(channel, data);
	}

	connected() {
		return this._socketClient.connected;
	}

	get socketClient() {
		return this._socketClient;
	}
}


module.exports = {
	SocketServer: SocketServer,
	SocketClient: SocketClient
};