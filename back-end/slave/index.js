let io = require('socket.io-client');
let colors = require('colors');
let performanceTestFunc = require('./performanceTestFunc');
//TODO
let instanceName = process.argv[2];
// let instanceName = require('../master/APIStatus/APIStatus').APIStatus[0].servers[0].name;
let masterConfig = require('./gadolinium-master');
let socket = io(`ws://${masterConfig.ipaddress}:${masterConfig.port}`, {
	query: {
		token: 'slave',
		name: instanceName
	}
});
// let socket = io(`ws://localhost:8080`, {
// 	query: {
// 		token: 'slave',
// 		name: instanceName
// 	}
// });

let cachedMessages = new Map();
let currentState = 'creating';

let sendMessage = (messageType, message) => {
	if (socket.connected) {
		socket.emit(messageType, message)
	} else {
		cachedMessages.set(cachedMessages.size + 1, {messageType, message});
	}
};

socket.on('reconnection', (api) => {
	// you may want to make sure you resend them in order, or one at a time, etc.
	if (currentState === 'testing') {
		cachedMessages.forEach((val, key) => {
			cachedMessages.delete(key);
			socket.emit(val.messageType, val.message);
		});
	} else if (currentState === 'creating') {
		//TODO FINISH
	}
});

socket.on('connect', () => {
	console.log("Connected to Master");
});

socket.on('disconnect', () => {
	console.log('Disconnected from Master');
});

socket.on('masterHandledTest', async ({api, testType}) => {
	currentState = 'testing';
	console.log('masterHandledTest');
	await performanceTestFunc[testType].singleTest(sendMessage, api);
});

socket.on('slaveHandledTest', async ({api, testType}) => {
	currentState = 'testing';
	console.log('slaveHandledTest');
	console.log('Test type : ' + testType);
	await performanceTestFunc.multipleTests(sendMessage, api, testType);
});

socket.on('masterHandledMessage', data => {
	console.log(data);
});

socket.on('slaveHandledMessage', data => {
	console.log(data);
});
