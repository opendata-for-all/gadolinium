let APIStatusFunc = require('../APIStatus/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');
let GCPFunc = require('../GoogleCloudManagement/functions');

//Variables initialized in case master crashes and has to restart
let slavesBooting = {};
let slavesTesting = {};
let slavesWaiting = {};
let instantSlaves = {};
let plannedSlaves = {};
let slavesToDelete = [];

let addSlavesThatAreBootingOrTesting = () => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus.map((api) => {
		let servers = api.servers;
		servers.map((server) => {
			if (server.type === "instant") {
				instantSlaves[server.name] = api;
			} else if (server.type === "planned") {
				plannedSlaves[server.name] = api;
			}
			if (server.status === "Booting up") {
				slavesBooting[server.name] = api
			} else if (server.status === "Testing") {
				slavesTesting[server.name] = api
			} else if (server.status === "Waiting for tests") {
				slavesWaiting[server.name] = api
			}
			server.status = "Waiting for connection...";
		})
	});
};

let slaveConnected = (slaveClient, slaveName) => {
	let api;
	if ((api = instantSlaves[slaveName])) {
		slaveClient.emit('instantTest', {
			apiId: api.id,
			slaveName: slaveName,
			httpRequests: api.httpRequests,
			progress: 0,
			totalProgress: api.httpRequests.length
		});
		addSlaveToDeleteList(slaveName);
		APIStatusFunc.updateServerStatus(api.id, slaveName, "Waiting for tests");
	} else if ((api = plannedSlaves[slaveName])) {
	}
	if ((api = slavesBooting[slaveName]) || (api = slavesWaiting[slaveName])) {
		APIStatusFunc.updateServerStatus(api.id, slaveName, "Waiting for tests");
	} else if ((api = slavesTesting[slaveName])) {
		APIStatusFunc.updateServerStatus(api.id, slaveName, "Testing");
	}
	socketServerFunc.emitAPIStatusUpdate();
};

let slaveDisconnected = (slaveName, api) => {
	APIStatusFunc.updateServerStatus(api.id, slaveName, "Disconnected. Waiting for reconnection...");
	socketServerFunc.emitAPIStatusUpdate();
};

let handleDisconnection = (slaveClient, slaveName, slaveCallback) => {
	slaveClient.on('disconnect', () => {
		console.log(slaveName + " disconnected");
		let reason;
		let api = slavesTesting[slaveName] ? slavesTesting[slaveName] : slavesWaiting[slaveName];
		if (api) { //TODO Difference from a server stopped running and a server stopped cause of tests finished
			reason = "unwantedDisconnection";
			slaveDisconnected(slaveName, api);
		} else if (slavesToDelete.includes(slaveName)) {
			reason = "vmDeleted";
			GCPFunc.deleteVM()
		}
		slaveCallback(reason);
	})
};

let slaveTesting = (slaveClient, slaveName) => {
	slaveClient.on('testProgression', (results) => {
		console.log(`API ${results.apiId} - Server ${slaveName} : Test ${results.progress} on ${results.totalProgress} completed.`);
		let apiId = results.apiId;
		if (slavesTesting.has(slaveName)) {
			if (latencySlaves.has(slaveName)) {
				let httpRequestId = results.httpRequestIndex;
				let testResult = results.testResults;
				APIStatusFunc.updateOperationTestResults(apiId, slaveName, httpRequestId, testResult);
			} else if (uptimeSlaves.has(slaveName)) {
				let isApiUp = results.up;
				let date = results.date;
				APIStatusFunc.recordAPIUpTime(apiId, slaveName, isApiUp, date);
			}
			APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, (server) => server.progress++);
		}
		socketServerFunc.emitAPIStatusUpdate();

	});

	slaveClient.on('repetitionFinished', (obj) => {
		let apiId = obj.apiId;
		if (masterHandledSlaves.has(slaveName)) {
			if (slavesTesting.has(slaveName)) {
				console.log('Repetition finished for ' + slaveName);
				if (APIStatusFunc.isLastTest(apiId, slaveName)) {
					//It was the last test, so it is time to delete the slave VM.
					console.log('Test completed for ' + slaveName);
					slavesTesting.delete(slaveName);
					APIStatusFunc.terminateServer(apiId, slaveName);
				} else {
					//It is not the last test, so launch a counter of the correct duration to launch the next test
					APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, server => {
						server.repetitionsRemaining--;
					});
					let server = APIStatusFunc.getServer(apiId, slaveName);
					let interval;
					if (latencySlaves.has(slaveName)) {
						interval = APIStatusFunc.getLatencyInterval(apiId);
					} else if (uptimeSlaves.has(slaveName)) {
						interval = APIStatusFunc.getUptimeInterval(apiId);
					}
					GCPFunc.turnVM(false, server.zone, server.name);
					setTimeout(() => {
						GCPFunc.turnVM(true, server.zone, server.name);
					}, interval);
					console.log("Slave " + slaveName + " restarting in " + interval / 60000 + ' minutes');
				}
			}
		} else if (slaveHandledSlaves.has(slaveName)) {
			if (APIStatusFunc.isLastTest(apiId, slaveName)) {
				//It was the last test, so it is time to delete the slave VM.
				console.log('Test completed for ' + slaveName);
				slavesTesting.delete(slaveName);
				APIStatusFunc.terminateServer(apiId, slaveName);
			} else {
				let interval;
				//It is not the last test, so launch a counter of the correct duration to launch the next test
				APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, server => {
					server.repetitionsRemaining--;
				});
				if (latencySlaves.has(slaveName)) {
					interval = APIStatusFunc.getLatencyInterval(apiId);
				} else if (uptimeSlaves.has(slaveName)) {
					interval = APIStatusFunc.getUptimeInterval(apiId);
				}
				console.log("Slave " + slaveName + " restarting in " + interval / 60000 + ' minutes');
			}
		}
	});

	slaveClient.on('completeTestFinished', (obj) => {
		let apiId = obj.apiId;
		if (slaveHandledSlaves.has(slaveName) && slavesTesting.has(slaveName)) {
			slavesTesting.delete(slaveName);
			APIStatusFunc.terminateServer(apiId, slaveName);
			socketServerFunc.emitAPIStatusUpdate();
		}
	})
};

module.exports = {
	slaveConnected: slaveConnected,
	addSlaveToBootingSlaveList: addSlaveToBootingSlaveList,
	addSlaveToTestSlaveList: addSlaveToTestSlaveList,
	addSlavesThatAreBootingOrTesting: addSlavesThatAreBootingOrTesting,
	handleDisconnection: handleDisconnection,
	slaveTesting: slaveTesting
};
