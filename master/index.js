let APIStatusFunc = require('./APIStatus/functions');
let socketServerCreationAndConnection = require('./socketServerManagement/socketServerCreationAndConnection');
let socketServerWebClientManagement = require('./socketServerManagement/socketServerWebClientManagement');
let socketServerSlaveManagement = require('./socketServerManagement/socketServerSlaveManagement');

let expressCreation = require('./expressManagement/expressCreation');
let expressEndpoint = require('./expressManagement/expressEndpoint');

let services = {};
services.socketSlaves = {};
services.webClients = [];

socketServerSlaveManagement.addSlavesThatAreBootingOrTesting();

let app = expressCreation.createApp(APIStatusFunc.getAPIStatus());
let httpServer = expressCreation.createHTTPServer(app);
expressEndpoint.createEndpoints(app);

let socketServer = socketServerCreationAndConnection.createSocketServer(httpServer);
services.socketServer = socketServer;
socketServerCreationAndConnection.createChannel(
	(webclient) => {
		services.webClients.push(webclient);
		socketServerWebClientManagement.createAPIStatusRequest(webclient);
		socketServerWebClientManagement.createAddingServerToTest(webclient);
		socketServerWebClientManagement.createServerDeletion(webclient, (response) => {
			if(response.status === 200){
				delete services.socketSlaves[response];
			}
		})
		socketServerWebClientManagement.createSendTestToSlaves(webclient, (data, APIStatus) => {
			let apiId = data.apiId;
			let slaveName = data.serverId;
			console.log("callback");
			services.socketSlaves[slaveName].emit('testApi', {apiId : apiId, api : APIStatus[apiId]});
		});
	},
	(slaveName, socketClient) => {
		services.socketSlaves[slaveName] = socketClient;
		socketServerSlaveManagement.slaveConnected(socketClient, slaveName);
		socketServerSlaveManagement.handleDisconnection(socketClient, slaveName, (reason) => {
			if(reason === "vmDeleted"){
				delete services.socketSlaves[slaveName]
			};
		});
		socketServerSlaveManagement.slaveTesting(socketClient, slaveName);
	});
expressCreation.launchHTTPServer(httpServer, 8080);