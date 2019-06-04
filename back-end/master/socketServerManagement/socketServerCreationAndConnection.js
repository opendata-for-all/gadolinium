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
				console.log("Slave " + authorizedNames[slaveIndex] + " joined");
				client.join(authorizedNames[slaveIndex]);
				slaveCallback(authorizedNames[slaveIndex], client)
			} else {
				console.log("Unauthorized connection");
				client.disconnect();
			}
		}
	})
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

module.exports = {
	createSocketServer: createSocketServer,
	createChannel: createChannel,
	emitAPIStatusUpdate: emitAPIStatusUpdate
};
