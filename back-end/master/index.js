let APIStatusFunc = require('./APIStatus/functions');
let socketServerCreationAndConnection = require('./socketServerManagement/socketServerCreationAndConnection');
let socketServerWebClientManagement = require('./socketServerManagement/socketServerWebClientManagement');
let socketServerSlaveManagement = require('./socketServerManagement/socketServerSlaveManagement');

let expressCreation = require('./expressManagement/expressCreation');
let expressEndpoint = require('./expressManagement/expressEndpoint');

let services = {};
services.socketSlaves = {};
services.webClients = [];

Array.prototype.remove = function (item) {
	let index = this.indexOf(item);
	if (index > -1) this.splice(index, 1)
};

socketServerSlaveManagement.addSlavesThatAreBootingOrTesting();

let app = expressCreation.createApp(APIStatusFunc.getAPIStatus());
let httpServer = expressCreation.createHTTPServer(app);
expressEndpoint.createEndpoints(app);

let socketServer = socketServerCreationAndConnection.createSocketServer(httpServer);
services.socketServer = socketServer;
socketServerCreationAndConnection.createChannel(
	(webclient) => {
		services.webClients.push(webclient);
		socketServerWebClientManagement.onAPIStatus(webclient);
		socketServerWebClientManagement.onAddTestServer(webclient);
		socketServerWebClientManagement.onDeleteServer(webclient, (response) => {
			delete services.socketSlaves[response];
		});
		socketServerWebClientManagement.createApiDeletion(webclient, () => {
		});
		socketServerWebClientManagement.createPlannedTestForSlaves(webclient, (data, APIStatus) => {
			let apiId = data.apiId;
			let slaveName = data.serverId;
			console.log("callback");
			services.socketSlaves[slaveName].emit('testApi', {apiId: apiId, api: APIStatus[apiId]});
		});
	},
	(slaveName, socketClient) => {
		services.socketSlaves[slaveName] = socketClient;
		socketServerSlaveManagement.slaveConnected(socketClient, slaveName);
		socketServerSlaveManagement.handleDisconnection(socketClient, slaveName, (reason) => {
			if (reason === "vmDeleted") {
				delete services.socketSlaves[slaveName]
			}
			;
		});
		socketServerSlaveManagement.slaveTesting(socketClient, slaveName);
	});
expressCreation.launchHTTPServer(httpServer, 8080);
