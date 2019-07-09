const http = require('http');
const WebSocketServer = require('socket.io');
const express = require('express');

let APIStatusFunc = require('../APIStatus/functions');

let socketServer;
let slavesClient = {};
let webClient = [];

let createSocketServer = (httpServer) => {
	socketServer = new WebSocketServer(httpServer);
	return socketServer;
};

let createChannel = (webClientCallback, slaveCallback) => {
	socketServer.on('connection', (client) => {
		let authorized = false;
		let APIStatus = APIStatusFunc.getAPIStatus();
		if (client.handshake.query.token === "webclient") {
			console.log("Webclient joined");
			client.join('webclient');
			emitAPIStatusUpdate();
			webClientCallback(client);
		} else if (client.handshake.query.token === "slave") {
			let authorizedNames = getAuthorizedNames(APIStatus);
			let slaveIndex;
			if ((slaveIndex = authorizedNames.indexOf(client.handshake.query.name)) !== -1) {
				authorized = true;
			}
			if (authorized) {
				slavesClient[authorizedNames[slaveIndex]] = client;
				client.join(authorizedNames[slaveIndex]);
				slaveCallback(authorizedNames[slaveIndex], client)
			} else {
				console.log("Unauthorized connection");
				client.disconnect();
			}
		}
	})
};

let apiDeleted = (apiId) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus.forEach((api) => {
		if (api.id === apiId) {
			api.servers.forEach((server) => {
				disconnectSlave(server.name);
			});
		}
	});
};

let disconnectSlave = (slaveName) => {
	if (slavesClient[slaveName]) slavesClient[slaveName].disconnect(true);
};

let getAuthorizedNames = () => {
	let authorizedNames = [];
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus.forEach((api) => {
		api.servers.forEach((server) => authorizedNames.push(server.name));
	});
	return authorizedNames;
};

let emitAPIStatusUpdate = () => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	socketServer.to('webclient').emit('APIStatus', APIStatus);
};

let emitLatencyTestUpdate = (apiId, slaveName, httpRequestIndex, newRecord) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	let httpRequest = APIStatusFunc.getHTTPRequest(apiId, httpRequestIndex);
	socketServer.to('webclient').emit('LatencyTestUpdate', {
		APIStatus,
		apiId,
		serverName: slaveName,
		httpRequestIndex,
		operationId: httpRequest.operationId,
		testResults: httpRequest.testResults,
		newRecord
	})
};

let emitUptimeTestUpdate = (apiId, slaveName, isApiUp, date) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	console.log('UptimeTestUpdate');
	socketServer.to('webclient').emit('UptimeTestUpdate', {
		APIStatus,
		apiId,
		serverName: slaveName,
		isApiUp,
		date
	})
}

module.exports = {
	createSocketServer: createSocketServer,
	createChannel: createChannel,
	apiDeleted: apiDeleted,
	disconnectSlave: disconnectSlave,
	emitAPIStatusUpdate: emitAPIStatusUpdate,
	emitLatencyTestUpdate: emitLatencyTestUpdate,
	emitUptimeTestUpdate: emitUptimeTestUpdate,

};
