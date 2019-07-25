let APIStatusFunc = require('../APIStatus/functions');
let GCPFunc = require('../GoogleCloudManagement/functions');
let socketServerFunc = require('./SocketServerCreationAndConnection');
let socketServerSlaveManagement = require('./socketServerSlaveManagement');

let onAPIStatus = (webClient) => {
	webClient.on('APIStatus', (callback) => {
		callback(APIStatus.getAPIStatus());
	});
};

let createApiDeletion = (webClient) => {
	webClient.on('deleteApi', async (apiId) => {
		console.log('API Deleted');
		socketServerFunc.apiDeleted(apiId);
		APIStatusFunc.deleteApi(apiId);
		socketServerFunc.emitAPIStatusUpdate();
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
	createApiDeletion: createApiDeletion,
	createOpenApiTestConfiguration : createOpenApiTestConfiguration
};
