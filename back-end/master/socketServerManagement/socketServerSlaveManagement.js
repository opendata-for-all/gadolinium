let APIStatusFunc = require('../APIStatus/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');
let GCPFunc = require('../GoogleCloudManagement/functions');

//Variables initialized in case master crashes and has to restart
let slavesBooting = {};
let slavesTesting = {};
let slavesWaiting = {};
let instantSlaves = {};
let plannedSlaves = {};
let slavesToDelete = [];

let addSlavesThatAreBootingOrTesting = () => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus.map((api) => {
		let servers = api.servers;
		servers.map((server) => {
			if (server.type === "instant") {
				instantSlaves[server.name] = api;
			} else if (server.type === "planned") {
				plannedSlaves[server.name] = api;
			}
			if (server.status === "Booting up") {
				slavesBooting[server.name] = api
			} else if (server.status === "Testing") {
				slavesTesting[server.name] = api
			} else if (server.status === "Waiting for tests") {
				slavesWaiting[server.name] = api
			}
			server.status = "Waiting for connection...";
		})
	});
};

let addSlaveToDeleteList = (slaveName) => {
	slavesToDelete.push(slaveName);
};

let addSlaveToBootingSlaveList = (slaveName, apiId) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			slavesBooting[slaveName] = api;
			return true;
		}
	})
};

let addSlaveToTestSlaveList = (slaveName, apiId, type) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			if (type === "instant") {
				instantSlaves[slaveName] = api;
			} else if (type === "planned") {
				plannedSlaves[slaveName] = api;
			}
			return true;
		}
	})
};

let addSlaveToInstantTestSlaveList = (slaveName, apiId) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			instantSlaves[slaveName] = api;
			return true;
		}
	})
};

let slaveConnected = (slaveClient, slaveName) => {
	let api;
	if ((api = instantSlaves[slaveName])) {
		slaveClient.emit('instantTest', {
			apiId: api.id,
			slaveName: slaveName,
			httpRequests: api.httpRequests,
			progress: 0,
			totalProgress: api.httpRequests.length
		});
		addSlaveToDeleteList(slaveName);
		APIStatusFunc.updateServerStatus(api.id, slaveName, "Waiting for tests");
	} else if ((api = plannedSlaves[slaveName])) {
	}
	if ((api = slavesBooting[slaveName]) || (api = slavesWaiting[slaveName])) {
		APIStatusFunc.updateServerStatus(api.id, slaveName, "Waiting for tests");
	} else if ((api = slavesTesting[slaveName])) {
		APIStatusFunc.updateServerStatus(api.id, slaveName, "Testing");
	}
	socketServerFunc.emitAPIStatusUpdate();
};

let slaveDisconnected = (slaveName, api) => {
	APIStatusFunc.updateServerStatus(api.id, slaveName, "Disconnected. Waiting for reconnection...");
	socketServerFunc.emitAPIStatusUpdate();
};

let handleDisconnection = (slaveClient, slaveName, slaveCallback) => {
	slaveClient.on('disconnect', () => {
		console.log(slaveName + " disconnected");
		let reason;
		let api = slavesTesting[slaveName] ? slavesTesting[slaveName] : slavesWaiting[slaveName];
		if (api) { //TODO Difference from a server stopped running and a server stopped cause of tests finished
			reason = "unwantedDisconnection";
			slaveDisconnected(slaveName, api);
		} else if (slavesToDelete.includes(slaveName)) {
			reason = "vmDeleted";
			GCPFunc.deleteVM()
		}
		slaveCallback(reason);
	})
};

let slaveTesting = (slaveClient, slaveName) => {
	slaveClient.on('testProgression', (testApiObject) => {
		console.log(`API ${testApiObject.apiId} - Server ${testApiObject.slaveName} : Test ${testApiObject.progress} on ${testApiObject.totalProgress} completed.`);
		let apiId = testApiObject.apiId;
		let serverId = testApiObject.slaveName;
		APIStatusFunc.updateServerInfos(apiId, serverId, {
			status: testApiObject.progressStatus,
			progress: testApiObject.progress,
			totalProgress: testApiObject.totalProgress
		});
		socketServerFunc.emitAPIStatusUpdate();
	})
};

module.exports = {
	slaveConnected: slaveConnected,
	addSlaveToBootingSlaveList: addSlaveToBootingSlaveList,
	addSlaveToTestSlaveList: addSlaveToTestSlaveList,
	addSlavesThatAreBootingOrTesting: addSlavesThatAreBootingOrTesting,
	handleDisconnection: handleDisconnection,
	slaveTesting: slaveTesting
};
