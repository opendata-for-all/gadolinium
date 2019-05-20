let io = require('socket.io-client');
let region = process.argv[2];
let instanceName = process.argv[3];
let masterConfig = require('./gadolinium-master');

let socket = io(`ws://${masterConfig.ipaddress}:${masterConfig.port}`, {
	query : {
		token : 'slave',
		name : instanceName
	}
});

socket.on('connect', () => {
	console.log("Connected to Master");
});