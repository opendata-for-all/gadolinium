let io = require('socket.io-client');
let region = process.argv[2];
// let instanceName = process.argv[3];
let instanceName = "api-1-asia-east2-b";
let masterConfig = require('./gadolinium-master');

// let socket = io(`ws://${masterConfig.ipaddress}:${masterConfig.port}`, {
// 	query : {
// 		token : 'slave',
// 		name : instanceName
// 	}
// });
let socket = io(`ws://localhost:8080`, {
	query: {
		token: 'slave',
		name: instanceName
	}
});

socket.on('connect', () => {
	console.log("Connected to Master");
	setTimeout(() => {
		socket.disconnect('reason');
		setTimeout(() => {
			socket.connect();
		}, 5000);
	}, 5000)
});

