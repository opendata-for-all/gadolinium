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
	}
	else if (config.type === "slave"){
		tool = new Slave(config);
		tool.connectToMasterSocketServer();
		tool.sendDataToMaster("Hello");
	}
}

let Compute = require('@google-cloud/compute');
const compute = new Compute({
	projectId: 'iron-crane-239115',
	keyFilename: 'GCPKeyFile.json'
});
compute.getZones(function(err, zones) {
	// `zones` is an array of `Zone` objects.
	for (let zone of zones){
		console.log(zone.name);
	}
	let zone0 = zones[0];
	zone0.
});