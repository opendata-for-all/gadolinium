let io = require('socket.io-client');
let region = process.argv[2];
let instanceName = process.argv[3];
// let instanceName = "api-1-europe-north1-a";
let masterConfig = require('./gadolinium-master');

let socket = io(`ws://${masterConfig.ipaddress}:${masterConfig.port}`, {
	query : {
		token : 'slave',
		name : instanceName
	}
});
// let socket = io(`ws://localhost:8080`, {
// 	query: {
// 		token: 'slave',
// 		name: instanceName
// 	}
// });

socket.on('connect', () => {
	console.log("Connected to Master");
	// setTimeout(() => {
	// 	socket.disconnect('reason');
	// 	setTimeout(() => {
	// 		socket.connect();
	// 	}, 5000);
	// }, 5000)
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
