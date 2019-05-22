let APIStatusFunc = require('../APIStatus/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');

//Variables initialized in case master crashes and has to restart
let slavesBooting = {};
let slavesTesting = {};
let slavesWaiting = {};
let slavesToDelete = [];

let addSlavesThatAreBootingOrTesting = () => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	let apis = Object.keys(APIStatus);
	apis.map((api) => {
		let servers = Object.keys(APIStatus[api].servers);
		servers.map((server) => {
			if (APIStatus[api].servers[server].status === "Booting up") {
				slavesBooting[server] = api
			} else if (APIStatus[api].servers[server].status === "Testing") {
				slavesTesting[server] = api
			} else if (APIStatus[api].servers[server].status === "Waiting for tests") {
				slavesWaiting[server] = api
			}
			APIStatus[api].servers[server].status = "Waiting for connection...";
		})
	});
};

let addSlaveToDeleteList = (slaveName) => {
	slavesToDelete.push(slaveName);
};

let addSlaveToBootingSlaveList = (slaveName, apidId) => {
	slavesBooting[slaveName] = apidId;
};

let slaveConnected = (slaveClient, slaveName) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	let apiId;
	if ((apiId = slavesBooting[slaveName])) {
		APIStatus[apiId].servers[slaveName].status = "Waiting for tests";
	} else if ((apiId = slavesWaiting[slaveName])) {
		APIStatus[apiId].servers[slaveName].status = "Waiting for tests";
	} else if ((apiId = slavesTesting[slaveName])) {
		APIStatus[apiId].servers[slaveName].status = "Testing";
	}
	APIStatusFunc.writeAPIStatus(APIStatus);
	socketServerFunc.emitAPIStatusUpdate();
};

let slaveDisconnected = (slaveName, apiId) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus[apiId].servers[slaveName].status = "Disconnected. Waiting for reconnection...";
	APIStatusFunc.writeAPIStatus(APIStatus);
	socketServerFunc.emitAPIStatusUpdate();
};

let handleDisconnection = (slaveClient, slaveName, slaveCallback) => {
	slaveClient.on('disconnect', () => {
		console.log(slaveName + " disconnected");
		let reason;
		let apiId = slavesTesting[slaveName] ? slavesTesting[slaveName] : slavesWaiting[slaveName];
		if (apiId) { //TODO Difference from a server stopped running and a server stopped cause of tests finished
			reason = "unwantedDisconnection";
			slaveDisconnected(slaveName, apiId);
		} else if (slavesToDelete.includes(slaveName)) {
			reason = "vmDeleted";
			slavesToDelete.remove(slaveName);
		}
		slaveCallback(reason);
	})
};

let slaveTesting = (slaveClient, slaveName) => {
	slaveClient.on('testProgress', (data) => {
		console.log('testProgress');
		let APIStatus = APIStatusFunc.getAPIStatus();
		let apiId = data.apiId;
		let serverId = data.slaveName;

		APIStatus[apiId].servers[serverId].status = "Testing";
		APIStatus[apiId].servers[serverId].progress = data.progress;
		APIStatus[apiId].servers[serverId].totalProgress = data.totalProgress;
		APIStatusFunc.writeAPIStatus(APIStatus);
		socketServerFunc.emitAPIStatusUpdate();
	})
};

module.exports = {
	slaveConnected: slaveConnected,
	addSlaveToBootingSlaveList: addSlaveToBootingSlaveList,
	addSlavesThatAreBootingOrTesting: addSlavesThatAreBootingOrTesting,
	handleDisconnection: handleDisconnection,
	slaveTesting: slaveTesting
};