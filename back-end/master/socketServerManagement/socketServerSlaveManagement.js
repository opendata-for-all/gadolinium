let APIStatusFunc = require('../APIStatus/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');
let GCPFunc = require('../GoogleCloudManagement/functions');

//Variables initialized in case master crashes and has to restart
let slavesCreating = new Map();
let slavesTesting = new Map();
let slavesWaiting = new Map();
let slaveHandledSlaves = new Map();
let masterHandledSlaves = new Map();
let latencySlaves = new Map();
let uptimeSlaves = new Map();
let slavesToDelete = new Map();

let updateMapsWithAPIStatus = () => {
	let APIStatus = APIStatusFunc.getAPIStatus();
	APIStatus.map((api) => {
		let servers = api.servers;
		servers.map((server) => {
			if (server.executionType === "masterHandled") {
				masterHandledSlaves.set(server.name, api.id);
			} else if (server.executionType === "slaveHandled") {
				slaveHandledSlaves.set(server.name, api.id);
			}
			if (server.testType === "latency") {
				latencySlaves.set(server.name, api.id);
			} else if (server.testType === "uptime") {
				uptimeSlaves.set(server.name, api.id);
			}
			if (server.status === "Creating VM...") {
				slavesCreating.set(server.name, api.id);
			} else if (server.status === "Testing...") {
				slavesTesting.set(server.name, api.id);
			} else if (server.status === "Test finished") {
				slavesToDelete.set(server.name, api.id);
			}
			server.status = "Waiting for connection...";
		})
	});
};

let slaveConnected = (slaveClient, slaveName) => {
	if (masterHandledSlaves.has(slaveName)) {
		console.log(slaveName + " MASTERHANDLED");
		//TODO Launch individual tests depending of its progression
		if (slavesCreating.has(slaveName)) {
			//TODO It's the first boot of the slave, launch the first test
			console.log(slaveName + " part of creating servers");
			let api = APIStatusFunc.getAPI(masterHandledSlaves.get(slaveName));
			let testType = latencySlaves.has(slaveName) ? "latency" : uptimeSlaves.has(slaveName) ? "uptime" : "";
			console.log('Test type will be ' + testType + '.');
			APIStatusFunc.initializeServerState(api.id, slaveName, testType, "masterHandled");
			slaveClient.emit('masterHandledTest', {api: api, testType: testType});
			slavesCreating.delete(slaveName);
			slavesTesting.set(slaveName, api.id);
		} else if (slavesTesting.has(slaveName)) {
			//TODO Not its first test, it booted up after a certain amount of time (span)
			let api = APIStatusFunc.getAPI(masterHandledSlaves.get(slaveName));
			let testType = latencySlaves.has(slaveName) ? "latency" : uptimeSlaves.has(slaveName) ? "uptime" : "";
			slaveClient.emit('masterHandledTest', {api: api, testType: testType})
		}
	} else if (slaveHandledSlaves.has(slaveName)) {
		console.log(slaveName + " SLAVEHANDLED");
		//TODO Launch the whole load of test
		if (slavesCreating.has(slaveName)) {
			//TODO The only state of boot that can happen
			let api = APIStatusFunc.getAPI(slaveHandledSlaves.get(slaveName));
			let testType = latencySlaves.has(slaveName) ? "latency" : uptimeSlaves.has(slaveName) ? "uptime" : "";
			APIStatusFunc.initializeServerState(api.id, slaveName, testType, "slaveHandled");
			slaveClient.emit('slaveHandledTest', {api: api, testType: testType});
			slavesCreating.delete(slaveName);
			slavesTesting.set(slaveName, api.id);
		} else if (slavesTesting.has(slaveName)) {
			//TODO If it was a testing slave, it is because the connection crashed between these two;
		}
	} else if(slavesToDelete.has(slaveName)){
		slaveClient.disconnect();
		let apiId = slavesToDelete.get(slaveName).api.id;
		let server = APIStatusFunc.getServer(apiId, slaveName);
		GCPFunc.deleteVM(server.zone, slaveName);
	}
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
				console.log(testResult);
				let newRecord = results.testResults.latencyRecords[0];
				socketServerFunc.emitLatencyTestUpdate(apiId, slaveName, httpRequestId, newRecord);
			} else if (uptimeSlaves.has(slaveName)) {
				let isApiUp = results.up;
				let date = results.date;
				APIStatusFunc.recordAPIUpTime(apiId, slaveName, isApiUp, date);
				socketServerFunc.emitUptimeTestUpdate(apiId, slaveName, isApiUp, date);
			}
			APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, (server) => server.progress++);
		}
		// socketServerFunc.emitAPIStatusUpdate();

	});

	slaveClient.on('repetitionFinished', (obj) => {
		let apiId = obj.apiId;
		if (masterHandledSlaves.has(slaveName)) {
			console.log(slaveName + 'as a masterHandled slave');
			if (slavesTesting.has(slaveName)) {
				console.log('Repetition finished for ' + slaveName);
				if (APIStatusFunc.isLastTest(apiId, slaveName)) {
					console.log('It was last test for ' + slaveName);
					//It was the last test, so it is time to delete the slave VM.
					slaveClient.emit('masterHandledMessage', 'It was last test');
					slaveClient.disconnect();
					slavesTesting.delete(slaveName);
					APIStatusFunc.terminateServer(apiId, slaveName);
				} else {
					//It is not the last test, so launch a counter of the correct duration to launch the next test
					APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, server => {
						server.repetitionsRemaining--;
						console.log('Tests remaining for ' + slaveName + ' : ' + server.repetitionsRemaining);
					});
					let server = APIStatusFunc.getServer(apiId, slaveName);
					let interval;
					slaveClient.emit('masterHandledMessage', 'At this time, slave should be turned off');
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
			console.log(slaveName + ' as a slaveHandled slave');
			if (APIStatusFunc.isLastTest(apiId, slaveName)) {
				console.log('It was last test for ' + slaveName);
				//It was the last test, so it is time to delete the slave VM.
				console.log('Test completed for ' + slaveName);
				slavesTesting.delete(slaveName);
				APIStatusFunc.terminateServer(apiId, slaveName);
			} else {
				let interval;
				//It is not the last test, so launch a counter of the correct duration to launch the next test
				APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, server => {
					server.repetitionsRemaining--;
					console.log(server);
				});
				if (latencySlaves.has(slaveName)) {
					interval = APIStatusFunc.getLatencyInterval(apiId);
				} else if (uptimeSlaves.has(slaveName)) {
					interval = APIStatusFunc.getUptimeInterval(apiId);
				}
				slaveClient.emit('slaveHandledMessage', 'At this time, slave should continue himself to test after the interval');
				console.log("Slave " + slaveName + " restarting in " + interval / 60000 + ' minutes');
			}
		}
	});

	slaveClient.on('completeTestFinished', (obj) => {
		let apiId = obj.apiId;
		console.log(slaveName + ' completed all tests');
		if (slaveHandledSlaves.has(slaveName) && slavesTesting.has(slaveName)) {
			slavesTesting.delete(slaveName);
			APIStatusFunc.terminateServer(apiId, slaveName);
			socketServerFunc.emitAPIStatusUpdate();
		}
	})
};

module.exports = {
	slaveConnected: slaveConnected,
	updateMapsWithAPIStatus: updateMapsWithAPIStatus,
	handleDisconnection: handleDisconnection,
	slaveTesting: slaveTesting
};
