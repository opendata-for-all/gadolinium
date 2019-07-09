let colors = require('colors');
let APIStatusFunc = require('../APIStatus/functions');
let socketServerFunc = require('./socketServerCreationAndConnection');
let GCPFunc = require('../GoogleCloudManagement/functions');

//Variables initialized in case master crashes and has to restart
let slavesCreating = new Map();
let slavesTesting = new Map();
let slavesCompleted = new Map();
let slavesDisconnected = new Map();
let slaveHandledSlaves = new Map();
let masterHandledSlaves = new Map();
let slavesWaiting = new Map();
let slavesRecording = new Map();
let slavesBooting = new Map();
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
			if (server.progress === 1 && server.progress === 1) {
				slavesCreating.set(server.name, api.id);
			} else if (server.progress < server.totalProgress) {
				slavesTesting.set(server.name, api.id);
			} else if (server.progress === server.totalProgress) {
				slavesCompleted.set(server.name, api.id);
				slavesToDelete.set(server.name, api.id);
			}
			if (server.progress > 1) slavesWaiting.set(server.name, api.id);
			slavesDisconnected.set(server.name, api.id);
		})
	});
};

let getTestTypeOfSlave = (slaveName) => {
	return latencySlaves.has(slaveName) ? 'latency' : uptimeSlaves.has(slaveName) ? 'uptime' : ''
};

let getExecutionTypeOfSlave = (slaveName) => {
	return masterHandledSlaves.has(slaveName) ? 'master' : slaveHandledSlaves.has(slaveName) ? 'slave' : '';
};

let slaveConnectedForTheFirstTime = (slaveClient, slaveName) => {
	console.log(`${slaveName.bold.underline} : Connected for the first time`);

	let api = APIStatusFunc.getAPI(slaveHandledSlaves.get(slaveName));
	let testType = getTestTypeOfSlave(slaveName);
	let executionType = getExecutionTypeOfSlave(slaveName);
	APIStatusFunc.initializeServerState(api.id, slaveName, testType, `${executionType}Handled`);
	slavesCreating.delete(slaveName);
	slavesTesting.set(slaveName, api.id);
	slavesRecording.set(slaveName, api.id);
	slaveClient.emit(`${executionType}HandledTest`, {api: api, testType: testType});
};

let slaveHandledSlaveReconnected = (slaveClient, slaveName) => {
	console.log(`${slaveName.bold.underline} : Slave handled slave reconnected`);
	console.log(`Cached records may be received`);
	slavesDisconnected.delete(slaveName);
};

let masterHandledSlaveReconnected = (slaveClient, slaveName) => {
	console.log(`${slaveName.bold.underline} : Master handled slave reconnected`);
	let api = APIStatusFunc.getAPI(masterHandledSlaves.get(slaveName));
	let testType = getTestTypeOfSlave(slaveName);
	slavesDisconnected.delete(slaveName);
	slavesBooting.delete(slaveName);
	slavesWaiting.delete(slaveName);
	slavesRecording.set(slaveName, api.id);
	slaveClient.emit('masterHandledTest', {api: api, testType: testType})
};

let slaveConnected = (slaveClient, slaveName) => {
	if (slavesToDelete.has(slaveName)) {
		//The slave need to be deleted for a certain reason
		slaveClient.disconnect();
	} else if (slavesDisconnected.has(slaveName)) {
		//The slave was disconnected
		if (slavesCompleted.has(slaveName)) {
			//The slave has completed all test he was supposed to do
			slaveClient.disconnect();
		} else if (slavesCreating.has(slaveName)) {
			//The slave was being created by the service provider and the VM just connected for the first time
			slaveConnectedForTheFirstTime(slaveClient, slaveName);
		} else if (slavesTesting.has(slaveName)) {
			//The slave is currently testing an API
			if (slavesWaiting.has(slaveName)) {
				if (slaveHandledSlaves.has(slaveName)) {
					slaveHandledSlaveReconnected(slaveClient, slaveName);
				} else if (masterHandledSlaves.has(slaveName)) {
					masterHandledSlaveReconnected(slaveClient, slaveName);
				} else {
					console.log(`${slaveName.bold.underline} : Execution type not handled`.red);
				}
			} else {
				console.log(`${slaveName.bold.underline} : Not waiting`.red);
			}
		} else {
			console.log(`${slaveName.bold.underline} : Not in creating or testing maps`.red);
		}
	} else {
		console.log(`${slaveName.bold.underline} : Not disconnected`);
	}
	socketServerFunc.emitAPIStatusUpdate();

	// if(slavesToDelete.has(slaveName)){
	// 	slaveClient.disconnect();
	// 	let apiId = slavesToDelete.get(slaveName).api.id;
	// 	let server = APIStatusFunc.getServer(apiId, slaveName);
	// 	GCPFunc.deleteVM(server.zone, slaveName);
	// }else if (masterHandledSlaves.has(slaveName)) {
	// 	console.log(slaveName + " MASTERHANDLED");
	// 	//TODO Launch individual tests depending of its progression
	// 	if (slavesCreating.has(slaveName)) {
	// 		//TODO It's the first boot of the slave, launch the first test
	// 		console.log(slaveName + " part of creating servers");
	// 		let api = APIStatusFunc.getAPI(masterHandledSlaves.get(slaveName));
	// 		let testType = latencySlaves.has(slaveName) ? "latency" : uptimeSlaves.has(slaveName) ? "uptime" : "";
	// 		console.log('Test type will be ' + testType + '.');
	// 		APIStatusFunc.initializeServerState(api.id, slaveName, testType, "masterHandled");
	// 		slaveClient.emit('masterHandledTest', {api: api, testType: testType});
	// 		slavesCreating.delete(slaveName);
	// 		slavesTesting.set(slaveName, api.id);
	// 	} else if (slavesTesting.has(slaveName)) {
	// 		//TODO Not its first test, it booted up after a certain amount of time (span)
	// 		let api = APIStatusFunc.getAPI(masterHandledSlaves.get(slaveName));
	// 		let testType = latencySlaves.has(slaveName) ? "latency" : uptimeSlaves.has(slaveName) ? "uptime" : "";
	// 		slaveClient.emit('masterHandledTest', {api: api, testType: testType})
	// 	}
	// } else if (slaveHandledSlaves.has(slaveName)) {
	// 	console.log(slaveName + " SLAVEHANDLED");
	// 	//TODO Launch the whole load of test
	// 	if (slavesCreating.has(slaveName)) {
	// 		//TODO The only state of boot that can happen
	// 		let api = APIStatusFunc.getAPI(slaveHandledSlaves.get(slaveName));
	// 		let testType = latencySlaves.has(slaveName) ? "latency" : uptimeSlaves.has(slaveName) ? "uptime" : "";
	// 		APIStatusFunc.initializeServerState(api.id, slaveName, testType, "slaveHandled");
	// 		slaveClient.emit('slaveHandledTest', {api: api, testType: testType});
	// 		slavesCreating.delete(slaveName);
	// 		slavesTesting.set(slaveName, api.id);
	// 	} else if (slavesTesting.has(slaveName)) {
	// 		//TODO If it was a testing slave, it is because the connection crashed between these two;
	// 	}
	// }
};

let deleteSlave = (slaveName) => {
	let apiId = slavesToDelete.get(slaveName);
	let server = APIStatusFunc.getServer(apiId, slaveName);
	GCPFunc.deleteVM(server.zone, slaveName);
	slavesToDelete.delete(slaveName);
};

let slaveDisconnected = (slaveClient, slaveName, slaveCallback) => {
	slaveClient.on('disconnect', () => {
		console.log(`${slaveName.bold.underline} : Disconnected`);
		let reason;
		if (slavesToDelete.has(slaveName)) {
			console.log(`${slaveName.bold.underline} : Needs to be deleted`);
			deleteSlave(slaveName);
			reason = "vmDeleted";
			slavesDisconnected.delete(slaveName);
		} else if (slavesTesting.has(slaveName)) {
			reason = "unwantedDisconnection";
			slavesDisconnected.set(slaveName, slavesTesting.get(slaveName));
		} else if (slavesCompleted.has(slaveName)) {
			console.log(`${slaveName.bold.underline} : Completed all tests and needs to be deleted`);
			deleteSlave(slaveName);
			reason = "vmDeleted";
			slavesCompleted.delete(slaveName);
		}
		socketServerFunc.emitAPIStatusUpdate();
		slaveCallback(reason);
	});

	slaveClient.on('consoleMessage', data => console.log(data.green));
};

let saveTheRecord = (slaveName, record) => {
	if (latencySlaves.has(slaveName)) {
		APIStatusFunc.updateOperationTestResults(record.apiId, slaveName, record.httpRequestIndex, record.testResults);
	} else if (uptimeSlaves.has(slaveName)) {
		APIStatusFunc.recordAPIUpTime(record.apiId, slaveName, record.up, record.date);
	} else {
		console.log(`${slaveName.bold.underline} : Neither a latency nor an uptime slave`);
	}
};

let emitTheRecordToWebClients = (slaveName, record) => {
	if (latencySlaves.has(slaveName)) {
		socketServerFunc.emitLatencyTestUpdate(
			record.apiId,
			slaveName,
			record.httpRequestIndex,
			record.testResults.latencyRecords[0]);
	} else if (uptimeSlaves.has(slaveName)) {
		socketServerFunc.emitUptimeTestUpdate(
			record.apiId,
			slaveName,
			record.up,
			record.date);
	}
};

let rebootTheVM = (apiId, slaveName) => {
	let server = APIStatusFunc.getServer(apiId, slaveName);
	let millisecondsIntervalUntilNextRepetition;
	if (latencySlaves.has(slaveName)) {
		millisecondsIntervalUntilNextRepetition = APIStatusFunc.getLatencyInterval(apiId);
	} else if (uptimeSlaves.has(slaveName)) {
		millisecondsIntervalUntilNextRepetition = APIStatusFunc.getUptimeInterval(apiId);
	}
	GCPFunc.turnVM(false, server.zone, server.name);
	GCPFunc.setBootUpScript(server.zone, slaveName);
	setTimeout(() => {
		GCPFunc.turnVM(true, server.zone, slaveName);
		slavesWaiting.delete(slaveName);
		slavesBooting.set(slaveName, apiId);
	}, millisecondsIntervalUntilNextRepetition);
	console.log(`${slaveName.bold.underline} : Restarting in ${millisecondsIntervalUntilNextRepetition / 60000} minutes`);

};

let repetitionFinishedFor = (slaveClient, slaveName, apiId) => {
	if (APIStatusFunc.isLastTest(apiId, slaveName)) {
		console.log(`${slaveName.bold.underline} : It was last repetition.`);
		APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, server => server.status = "Test completed.");
		slavesToDelete.set(slaveName, apiId);
		slavesCompleted.set(slaveName, apiId);
		slaveClient.disconnect();
	} else {
		APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, server => {
			server.repetitionsRemaining--;
			console.log(`${slaveName.bold.underline} : ${server.repetitionsRemaining} tests remaining`);
		});
		if (masterHandledSlaves.has(slaveName)) rebootTheVM(apiId, slaveName);

	}
};

let slaveTesting = (slaveClient, slaveName) => {
	slaveClient.on('record', (record) => {
		if (slavesTesting.has(slaveName)) {
			if (slavesRecording.has(slaveName)) {
				saveTheRecord(slaveName, record);
				APIStatusFunc.applyFunctionToOneServer(record.apiId, slaveName, (server) => {
					server.progress++;
					console.log(`${slaveName.bold.underline} : Record ${server.progress} / ${server.totalProgress}`);
				});
				emitTheRecordToWebClients(slaveName, record);
			} else {
				console.log(`${slaveName.bold.underline} : Not recording`.red);
			}
		} else {
			console.log(`${slaveName.bold.underline} : Not testing`.red);
		}
	});

	slaveClient.on('repetition', ({apiId}) => {
		if (slavesTesting.has(slaveName)) {
			if (slavesRecording.has(slaveName)) {
				repetitionFinishedFor(slaveClient, slaveName, apiId);
				if (masterHandledSlaves.has(slaveName)) {
					slavesRecording.delete(slaveName);
					slavesWaiting.set(slaveName, apiId);
				}
			} else {
				console.log(`${slaveName.bold.underline} : Not recording`.red);
			}
		} else {
			console.log(`${slaveName.bold.underline} : Not testing`.red);
		}
		// let apiId = obj.apiId;
		// if (masterHandledSlaves.has(slaveName)) {
		// 	console.log(slaveName + 'as a masterHandled slave');
		// 	if (slavesTesting.has(slaveName)) {
		// 		console.log('Repetition finished for ' + slaveName);
		// 		if (APIStatusFunc.isLastTest(apiId, slaveName)) {
		// 			console.log('It was last test for ' + slaveName);
		// 			//It was the last test, so it is time to delete the slave VM.
		// 			slaveClient.emit('masterHandledMessage', 'It was last test');
		// 			slaveClient.disconnect();
		// 			slavesTesting.delete(slaveName);
		// 			APIStatusFunc.terminateServer(apiId, slaveName);
		// 		} else {
		// 			//It is not the last test, so launch a counter of the correct duration to launch the next test
		// 			APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, server => {
		// 				server.repetitionsRemaining--;
		// 				console.log('Tests remaining for ' + slaveName + ' : ' + server.repetitionsRemaining);
		// 			});
		// 			let server = APIStatusFunc.getServer(apiId, slaveName);
		// 			let interval;
		// 			slaveClient.emit('masterHandledMessage', 'At this time, slave should be turned off');
		// 			if (latencySlaves.has(slaveName)) {
		// 				interval = APIStatusFunc.getLatencyInterval(apiId);
		// 			} else if (uptimeSlaves.has(slaveName)) {
		// 				interval = APIStatusFunc.getUptimeInterval(apiId);
		// 			}
		// 			GCPFunc.turnVM(false, server.zone, server.name);
		// 			setTimeout(() => {
		// 				GCPFunc.turnVM(true, server.zone, server.name);
		// 			}, interval);
		// 			console.log("Slave " + slaveName + " restarting in " + interval / 60000 + ' minutes');
		// 		}
		// 	}
		// } else if (slaveHandledSlaves.has(slaveName)) {
		// 	console.log(slaveName + ' as a slaveHandled slave');
		// 	if (APIStatusFunc.isLastTest(apiId, slaveName)) {
		// 		console.log('It was last test for ' + slaveName);
		// 		//It was the last test, so it is time to delete the slave VM.
		// 		console.log('Test completed for ' + slaveName);
		// 		slavesTesting.delete(slaveName);
		// 		APIStatusFunc.terminateServer(apiId, slaveName);
		// 	} else {
		// 		let interval;
		// 		//It is not the last test, so launch a counter of the correct duration to launch the next test
		// 		APIStatusFunc.applyFunctionToOneServer(apiId, slaveName, server => {
		// 			server.repetitionsRemaining--;
		// 			console.log(server);
		// 		});
		// 		if (latencySlaves.has(slaveName)) {
		// 			interval = APIStatusFunc.getLatencyInterval(apiId);
		// 		} else if (uptimeSlaves.has(slaveName)) {
		// 			interval = APIStatusFunc.getUptimeInterval(apiId);
		// 		}
		// 		slaveClient.emit('slaveHandledMessage', 'At this time, slave should continue himself to test after the interval');
		// 		console.log("Slave " + slaveName + " restarting in " + interval / 60000 + ' minutes');
		// 	}
		// }
	});
};

module.exports = {
	slaveConnected: slaveConnected,
	updateMapsWithAPIStatus: updateMapsWithAPIStatus,
	slaveDisconnected: slaveDisconnected,
	slaveTesting: slaveTesting
};
