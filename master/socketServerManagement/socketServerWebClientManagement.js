let APIStatusFunc = require('../APIStatus/functions');
let GCPFunc = require('../GoogleCloudManagement/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');
let socketServerSlaveManagement = require('./socketServerSlaveManagement');

let createAPIStatusRequest = (webClient) => {
	webClient.on('APIStatus', (callback) => { //TODO In test
		callback(APIStatus.getAPIStatus());
	});
};

let createNewAPITestRequest = (webClient) => {
	webClient.on('newAPITest', (callback) => { //TODO In test
		callback(APIStatus.getAPIStatus());
	});
};

let createServerDeletion = (webClient, callback) => {
	webClient.on('deleteServer', async (data) => {
		let APIStatus = APIStatusFunc.getAPIStatus();
		let apiId = data.apiId;
		let serverId = data.serverId;
		let zone = APIStatus[apiId].servers[serverId].zone;
		let response = await GCPFunc.deleteVM(zone, serverId);
		delete APIStatus[apiId].servers[serverId];
		APIStatusFunc.writeAPIStatus(APIStatus);
		socketServerFunc.emitAPIStatusUpdate();
		if (response.status === 200) {
			callback(true);
		} else if (response.status === 404) {
			callback(false);
		}
	})
};

let createAddingServerToTest = (webclient) => {
	webclient.on('newServerToTest', (data) => {
		console.log(data);
		let APIStatus = APIStatusFunc.getAPIStatus();
		let serverList = data.regions;
		let apiId = data.apiId;
		let servers = createServerInstance(serverList, apiId);
		updateAPIStatusWithNewServers(APIStatus, servers, apiId);
		for (let server in servers) {
			socketServerSlaveManagement.addSlaveToBootingSlaveList(server, apiId);
		}
		socketServerFunc.emitAPIStatusUpdate();
	})
};

let updateAPIStatusWithNewServers = (APIStatus, servers, apiId) => {
	for (let server in servers) {
		APIStatus[apiId].servers[server] = servers[server];
	}
	APIStatusFunc.writeAPIStatus(APIStatus);
};

let createServerInstance = (serverList, apiId) => {
	let gcpServerList = GCPFunc.getListOfZones();
	let servers = {};
	for (let server of serverList) {
		let randomZone = gcpServerList[server].zones[Math.floor(Math.random() * gcpServerList[server].zones.length)];
		let zoneName = `${server}-${randomZone}`;
		let vmName = `api-${apiId}-${zoneName}`;
		servers[vmName] = {
			region: server,
			zone: zoneName,
			location: gcpServerList[server].location,
			status: "Booting up",
			progress: 1,
			totalProgress: 1
		};
		GCPFunc.createVM(zoneName, vmName);
	}
	return servers;
};

let createSendTestToSlaves = (webclient, callback) => {
	webclient.on('testForm', (data) => {
		console.log(data);
		let APIStatus = APIStatusFunc.getAPIStatus();
		let apiId = data.apiId;
		let servers = data.serversId;
		servers.map((serverId) => {
			APIStatus[apiId].servers[serverId].status = "Testing";
			APIStatus[apiId].servers[serverId].progress = 0;
			APIStatus[apiId].servers[serverId].totalProgress = 20;
			APIStatusFunc.writeAPIStatus(APIStatus);
			socketServerFunc.emitAPIStatusUpdate();
			callback({apiId : apiId, serverId : serverId}, APIStatus);
		});
	})
}

module.exports = {
	createAPIStatusRequest: createAPIStatusRequest,
	createAddingServerToTest: createAddingServerToTest,
	createServerDeletion: createServerDeletion,
	createSendTestToSlaves: createSendTestToSlaves
}