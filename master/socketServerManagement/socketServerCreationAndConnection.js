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

let createChannelForSlave = (slave, callback) => {
	// socketServer.of('/' + slave.name).on('connection', (client) => {
	// 	let authorized = false;
	// 	if (client.handshake.query.name === slave.name) {
	// 		authorized = true;
	// 	}
	// 	if (authorized) {
	// 		callback(slave, client)
	// 	} else {
	// 		client.disconnect();
	// 	}
	// })
};

let createChannel = (webClientCallback, slaveCallback) => {
	socketServer.on('connection', (client) => {
		let authorized = false;
		let APIStatus = APIStatusFunc.getAPIStatus();
		if (client.handshake.query.token === "webclient") {
			console.log("Webclient joined");
			client.join('webclient');
			socketServer.to('webclient').emit('APIStatus', APIStatus);
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
	let apis = Object.values(APIStatus);
	for (let api of apis) {
		authorizedNames.push(...Object.keys(api.servers));
	}
	return authorizedNames;
};

let emitAPIStatusUpdate = () => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	socketServer.to('webclient').emit('APIStatus', APIStatus);
};

module.exports = {
	createSocketServer: createSocketServer,
	createChannelForSlave: createChannelForSlave,
	createChannel: createChannel,
	emitAPIStatusUpdate: emitAPIStatusUpdate
};
