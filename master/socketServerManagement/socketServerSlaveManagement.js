let APIStatusFunc = require('../APIStatus/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');

let slavesBooting = {
	testSlave: 1
};

let addSlaveToBootingSlaveList = (slaveName, apidId) => {
	slavesBooting[slaveName] = apidId;
};

let serverBootedUp = (slaveClient, serverName) => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	let apiId = slavesBooting[serverName];
	APIStatus[apiId].servers[serverName].status = "Waiting for tests";
	APIStatusFunc.writeAPIStatus(APIStatus);
	socketServerFunc.emitAPIStatusUpdate();
};

module.exports = {
	serverBootedUp: serverBootedUp,
	addSlaveToBootingSlaveList: addSlaveToBootingSlaveList
};