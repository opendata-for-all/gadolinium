let APIStatusFunc = require('../APIStatus/functions');
let GCPFunc = require('../GoogleCloudManagement/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');
let socketServerSlaveManagement = require('./socketServerSlaveManagement');

let onAPIStatus = (webClient) => {
	webClient.on('APIStatus', (callback) => {
		callback(APIStatus.getAPIStatus());
	});
};

let onDeleteServer = (webClient, callback) => {
	webClient.on('deleteServer', async (data) => {
		let apiId = data.apiId;
		let serverName = data.serverName;
		let zone = data.zone;
		APIStatusFunc.deleteServer(apiId, serverName);
		socketServerFunc.disconnectSlave(serverName);
		socketServerFunc.emitAPIStatusUpdate();
		callback(serverName);
	})
};

let createApiDeletion = (webClient, callback) => {
	webClient.on('deleteApi', async (apiId) => {
		console.log('API Deleted');
		socketServerFunc.apiDeleted(apiId);
		APIStatusFunc.deleteApi(apiId);
		socketServerFunc.emitAPIStatusUpdate();
	})
};

let createSendTestToSlaves = (webclient, callback) => {
	webclient.on('testForm', (data) => {
		console.log(data);
		let APIStatus = APIStatusFunc.getAPIStatus();
		let apiId = data.apiId;
		let serversName = data.serversName;
		serversName.map((serverName) => {
			APIStatus[apiId].servers[serverName].status = "Testing";
			APIStatus[apiId].servers[serverName].progress = 0;
			APIStatus[apiId].servers[serverName].totalProgress = 20;
			APIStatusFunc.writeAPIStatus(APIStatus);
			socketServerFunc.emitAPIStatusUpdate();
			callback({apiId: apiId, serverId: serverName}, APIStatus);
		});
	})
};

let createOpenApiTestConfiguration = (webclient) => {
	webclient.on('openApiTestConfig', data => {
		APIStatusFunc.addOpenApiTestConfigToApi(data.apiId, data.config);
		APIStatusFunc.createServerInstanceFromOpenApiTestConfig(data.apiId);
		socketServerSlaveManagement.addNewOpenAPIConfigSlavesToMaps(data.apiId);
		socketServerFunc.emitAPIStatusUpdate();
	})
};

module.exports = {
	onAPIStatus: onAPIStatus,
	onDeleteServer: onDeleteServer,
	createApiDeletion: createApiDeletion,
	createPlannedTestForSlaves: createSendTestToSlaves,
	createOpenApiTestConfiguration : createOpenApiTestConfiguration
};
