let APIStatusFunc = require('../APIStatus/functions');
let GCPFunc = require('../GoogleCloudManagement/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');
let socketServerSlaveManagement = require('./socketServerSlaveManagement');

let onAPIStatus = (webClient) => {
	webClient.on('APIStatus', (callback) => {
		callback(APIStatus.getAPIStatus());
	});
};

let onApiDeletion = (webClient) => {
	webClient.on('deleteApi', async (apiId) => {
		console.log('API Deleted');
		socketServerFunc.apiDeleted(apiId);
		APIStatusFunc.deleteApi(apiId);
		socketServerFunc.emitAPIStatusUpdate();
	})
};

let onOpenApiTestConfiguration = (webclient) => {
	webclient.on('openApiTestConfig', data => {
		APIStatusFunc.addOpenApiTestConfigToApi(data.apiId, data.config);
		APIStatusFunc.createServerInstanceFromOpenApiTestConfig(data.apiId);
		socketServerSlaveManagement.addNewOpenAPITestConfigSlavesToMaps(data.apiId);
		socketServerFunc.emitAPIStatusUpdate();
	})
};

module.exports = {
	onAPIStatus: onAPIStatus,
	onApiDeletion: onApiDeletion,
	onOpenApiTestConfiguration : onOpenApiTestConfiguration
};
