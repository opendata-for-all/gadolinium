const Master = require('./Classes/ServerTypeClasses/Master');
const Slave = require('./Classes/ServerTypeClasses/Slave');
const MasterExpressApp = require('./Classes/MasterExpressApp');
const HTTPServer = require('./Classes/HTTPServer');
let tool;
let configFile = require('./nfrtoolconfig' + process.argv[2]);
const {SocketServer} = require("./Classes/Socket");

bootUp(configFile);

function bootUp(config) {
	if (config.type === "master") {
		tool = new Master(config);
		let masterApp = new MasterExpressApp(tool);
		let masterHTTPServer = new HTTPServer(config.httpServer, masterApp);
		masterHTTPServer.setExpressApp(masterApp);
		masterHTTPServer.launchServer();

		let masterSocketServer = new SocketServer(config.socket, tool);
		masterSocketServer.launchServer();

		tool.setSocketServer(masterSocketServer);
		tool.setApp(masterApp);
		tool.setHTTPServer(masterHTTPServer);

		tool.createSlaveSocketChannels();
	} else if (config.type === "slave") {
		tool = new Slave(config);
		tool.connectToMasterSocketServer();
		tool.sendDataToMaster("Hello");
	}
}