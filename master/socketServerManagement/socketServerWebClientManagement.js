let APIStatusFunc = require('../APIStatus/functions');
let GCPFunc = require('../GoogleCloudManagement/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');

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

let createAddingServerToTest = (webclient) => {
	webclient.on('newServerToTest', (data) => {
		console.log(data);
		let APIStatus = APIStatusFunc.getAPIStatus();
		let serverList = data.regions;
		let apiId = data.apiId;
		let servers = createServerInstance(serverList, apiId);
		updateAPIStatusWithNewServers(APIStatus, servers, apiId);
		socketServerFunc.emitAPIStatusUpdate();
		socketServerFunc.createChannelForSlave()
	})
};

let updateAPIStatusWithNewServers = (APIStatus, servers, apiId) => {
	APIStatus[apiId].servers = servers;
	APIStatusFunc.writeAPIStatus(APIStatus);
};

let createServerInstance = (serverList, apiId) => {
	let gcpServerList = GCPFunc.getListOfZones();
	let servers = {};
	for (let server of serverList) {
		let randomZone = gcpServerList[server].zones[Math.floor(Math.random() * gcpServerList[server].zones.length)];
		let regionName = `${server}-${randomZone}`;
		let vmName = `api-${apiId}-${regionName}`;
		servers[server] = {
			region : regionName,
			zone : randomZone,
			location : gcpServerList[server].location,
			status : "Booting up",
			progress : 1,
			totalProgress : 1
		};

		GCPFunc.createVM(regionName, vmName);
	}
	return servers;
};

module.exports = {
	createAPIStatusRequest : createAPIStatusRequest,
	createAddingServerToTest : createAddingServerToTest
}