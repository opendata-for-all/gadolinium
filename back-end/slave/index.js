let io = require('socket.io-client');
let colors = require('colors');
let performanceTestFunc = require('./performanceTestFunc');
//TODO
let instanceName = process.argv[2];
// let instanceName = require('../master/APIStatus/APIStatus').APIStatus[0].servers[0].name;
let masterConfig = require('./gadolinium-master');
console.log(instanceName);
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

pendingMessagesForSocket = new Map();

let sendMessage = (messageType, message) => {
	if (socket.connected) {
		socket.emit(messageType, message)
	} else {
		pendingMessagesForSocket.set(pendingMessagesForSocket.size + 1, {messageType, message});
	}
	console.log('Content of the map'.underline);
	console.log(pendingMessagesForSocket);
};

socket.on('reconnection', () => {
	// you may want to make sure you resend them in order, or one at a time, etc.
	pendingMessagesForSocket.forEach((val, key) => {
		pendingMessagesForSocket.delete(key);
		socket.emit(val.messageType, val.message);
	});
	console.log('Content of the map'.underline);
	console.log(pendingMessagesForSocket);
});

socket.on('connect', () => {
	console.log("Connected to Master");
});

socket.on('disconnect', () => {
	console.log('Disconnected from Master');
});

socket.on('testApi', (data) => {
	console.log(data);
	let i = 1;
	let apiId = data.apiId;
	setInterval(() => {
		socket.emit('testProgress', {apiId: apiId, slaveName: instanceName, progress: i + 1, totalProgress: 20});
		i++;
		if (i === 20) clearInterval(interval);
	}, 5000);
});

socket.on('masterHandledTest', async ({api, testType}) => {
	console.log('masterHandledTest');
	let results = {};
	results.testResults = await performanceTestFunc[testType].singleTest(sendMessage, api);
	sendMessage('repetition', {apiId: api.id});
});

socket.on('slaveHandledTest', async ({api, testType}) => {
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
