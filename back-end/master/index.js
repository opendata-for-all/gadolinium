let APIStatusFunc = require('./APIStatus/functions');
let socketServerCreationAndConnection = require('./SocketServerManagement/socketServerCreationAndConnection');
let socketServerWebClientManagement = require('./SocketServerManagement/socketServerWebClientManagement');
let socketServerSlaveManagement = require('./SocketServerManagement/socketServerSlaveManagement');

let expressCreation = require('./ExpressManagement/expressCreation');
let expressEndpoint = require('./ExpressManagement/expressEndpoint');

Array.prototype.remove = function (item) {
	let index = this.indexOf(item);
	if (index > -1) this.splice(index, 1)
};

socketServerSlaveManagement.initializeMapsWithAPIStatus();

let app = expressCreation.createApp();
expressEndpoint.createEndpoints(app);
let httpServer = expressCreation.createHTTPServer(app);

socketServerCreationAndConnection.createSocketServer(httpServer);
socketServerCreationAndConnection.createChannel(
	(webclient) => {
		socketServerWebClientManagement.onAPIStatus(webclient);
		socketServerWebClientManagement.onApiDeletion(webclient);
		socketServerWebClientManagement.onOpenApiTestConfiguration(webclient)
	},
	(slaveName, socketClient) => {
		socketServerSlaveManagement.slaveConnected(socketClient, slaveName);
		socketServerSlaveManagement.slaveDisconnected(socketClient, slaveName);
		socketServerSlaveManagement.slaveTesting(socketClient, slaveName);
	});
expressCreation.launchHTTPServer(httpServer, 80);
