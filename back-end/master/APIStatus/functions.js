let fs = require('fs');
let path = require('path');
let {Duration} = require('luxon');
let GCPFunc = require('../GoogleCloudManagement/functions');
let performPingTest = require('../../slave/performanceTestFunc').performPingTest;

let getAPIStatus = () => {
	let APIStatus = fs.readFileSync(path.join(__dirname, 'APIStatus.json'));
	return JSON.parse(APIStatus).APIStatus;
};

let writeAPIStatus = (data) => {
	let APIStatus = {APIStatus: data};
	updateAPIProgress(APIStatus);
	APIStatus = JSON.stringify(APIStatus);
	fs.writeFileSync(path.join(__dirname, 'APIStatus.json'), APIStatus);
};

let updateAPIProgress = (APIStatus) => {
	Object.values(APIStatus.APIStatus).map((api) => {
		api.progress = (Object.values(api.servers)).reduce((accum, server) => {
			return accum + server.progress;
		}, 0);
		api.totalProgress = (Object.values(api.servers)).reduce((accum, server) => {
			return accum + server.totalProgress;
		}, 0);
	})
};

let getNewApiId = (APIStatus) => {
	let apiIds = APIStatus.map((api) => api.id);
	for (let i = 0; i <= Math.max(...apiIds) + 1; i++) {
		if (!apiIds.includes(i)) return i;
	}
	return 0;
};

let getOperationTestsObject = (httpRequests) => {
	let operationTests = [];
	httpRequests.reduce((obj, httpRequest) => {
		return obj.concat([{
			operationId: httpRequest.operationId,
			parameters: httpRequest.params
		}])
	}, operationTests);
	return operationTests;
};

let prepareOpenAPIExtensionObject = async (host, httpRequests) => {
	let obj = {};
	let acceptICMP = await performPingTest(host);
	obj.performance = {
		testCount: 0,
		latency: {
			mean: null,
			min: null,
			max: null
		},
		operationTests: getOperationTestsObject(httpRequests)
	};
	obj.availability = {
		acceptICMP: acceptICMP
	};
	return obj;
};

let addApi = async (newApi) => {
	let APIStatus = getAPIStatus();
	let id = getNewApiId(APIStatus);
	let apiObj = {
		id: id,
		name: newApi.host,
		httpRequests: newApi.httpRequests,
		servers: [],
		progress: 0,
		totalProgress: 0,
		uptimeResults: {},
	};
	APIStatus.push(apiObj);
	writeAPIStatus(APIStatus);
	return id;
};

let deleteApi = (apiId) => {
	let APIStatus = getAPIStatus();
	let apiToDelete;
	APIStatus.forEach((api) => {
		if (api.id === apiId) {
			api.servers.forEach((server) => {
				GCPFunc.deleteVM(server.zone, server.name);
			});
			apiToDelete = api;
		}
	});
	APIStatus.remove(apiToDelete);
	writeAPIStatus(APIStatus);
};

let addOpenApiTestConfigToApi = (apiId, config) => {
	let APIStatus = getAPIStatus();
	APIStatus.forEach(api => {
		if (api.id === apiId) {
			api.testConfig = config;
		}
	});
	console.log("Config ajoutée");
	writeAPIStatus(APIStatus);
};

let createServerInstanceFromOpenApiTestConfig = (apiId) => {
	let APIStatus = getAPIStatus();
	APIStatus.forEach((api) => {
		if (apiId === api.id) {
			let latencyExecutionType = determineExecutionType(api.testConfig.latency);
			let uptimeExecutionType = determineExecutionType(api.testConfig.uptime);
			api.servers.push(...createServerInstance(api.testConfig.latency.zones, apiId, "latency", latencyExecutionType));
			api.servers.push(...createServerInstance(api.testConfig.uptime.zones, apiId, "uptime", uptimeExecutionType));
		}
	});
	writeAPIStatus(APIStatus);
};

let determineExecutionType = (config) => {
	let minuteOfMinimumDelay = 10;
	let duration = config.interval.iso8601format;
	let formattedDuration = Duration.fromISO(duration);
	let milliseconds = formattedDuration.valueOf();
	if (milliseconds > (minuteOfMinimumDelay * 60000)) {
		return "masterHandled"
	} else {
		return "slaveHandled"
	}
};

let createServerInstance = (serverList, apiId, testType, executionType) => {
	let gcpServerList = GCPFunc.getListOfZones();
	let servers = [];
	for (let server of serverList) {
		let randomZone = gcpServerList[server].zones[Math.floor(Math.random() * gcpServerList[server].zones.length)];
		let zoneName = `${server}-${randomZone}`;
		let vmName = `api-${apiId}-${zoneName}-${testType}`;
		servers.push({
			name: vmName,
			testType: testType,
			executionType: executionType,
			region: server,
			zone: zoneName,
			location: gcpServerList[server].location,
			status: "Creating VM...",
			progress: 1,
			totalProgress: 1
		});
		GCPFunc.createVM(zoneName, vmName);
	}
	return servers;
};

let addServers = (apiId, servers) => {
	let APIStatus = getAPIStatus();
	APIStatus.map((api) => {
		if (api.id === apiId) {
			api.servers = [...api.servers, ...servers];
		}
		return api;
	});
	writeAPIStatus(APIStatus);
};

let deleteServer = (apiId, serverName) => {
	applyFunctionToOneServer(apiId, serverName, (server) => {
		GCPFunc.deleteVM(server.zone, server.name);
		server.status = "Deleted";
	});
};

let updateServerStatus = (apiId, serverName, status) => {
	applyFunctionToOneServer(apiId, serverName, server => server.status = status);
};

let updateServerInfos = (apiId, serverName, newServer) => {
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			api.servers.forEach((server) => {
				if (server.name === serverName) {
					server.status = newServer.status;
					server.progress = newServer.progress;
					server.totalProgress = newServer.totalProgress;
					return true;
				}
			});
			return true;
		}
	});
	writeAPIStatus(APIStatus)
};

let initializeServerState = (apiId, serverName, testType, handlingType) => {
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			return api.servers.some((server) => {
				if (server.name === serverName) {
					//TODO REMETTRE LE TESTING
					server.status = "Testing...";
					server.progress = 0;
					if (server.testType === 'latency') {
						server.totalProgress = api.httpRequests.length * api.testConfig[server.testType].repetitions;
					} else if (server.testType === 'uptime') {
						server.totalProgress = api.testConfig[server.testType].repetitions;
					}
					if (handlingType === "masterHandled") {
						server.repetitionsRemaining = api.testConfig[server.testType].repetitions;
					}
					return true;
				}
			});
		}
	});
	writeAPIStatus(APIStatus);
};

let updateOperationTestResults = (apiId, slaveName, httpRequestIndex, testResult) => {
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			if (api.httpRequests[httpRequestIndex] && api.httpRequests[httpRequestIndex].testResults) {
				if (!api.httpRequests[httpRequestIndex].testResults[slaveName]) {
					api.httpRequests[httpRequestIndex].testResults[slaveName] = {
						latencyRecords: []
					}
				}
				let testRecords = api.httpRequests[httpRequestIndex].testResults[slaveName];
				testRecords.avgSuccess = ((testRecords.avgSuccess * testRecords.latencyRecords.length) + testResult.success) / (testRecords.latencyRecords.length + 1);
				testRecords.latencyRecords.push(...testResult.latencyRecords);
				testRecords.totalTest = testRecords.latencyRecords.length;
				testRecords.meanLatency = (testRecords.latencyRecords.reduce((accum, record) => {
					return accum + record.latencyMs;
				}, 0) / testRecords.totalTest).toFixed(2);
			} else {
				api.httpRequests[httpRequestIndex].testResults = {};
				api.httpRequests[httpRequestIndex].testResults[slaveName] = testResult;
			}
			return true;
		}
	});
	writeAPIStatus(APIStatus);
};

let isLastTest = (apiId, serverId) => {
	let isLastTest = false;
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			return api.servers.some((server) => {
				if (server.name === serverId) {
					isLastTest = (server.repetitionsRemaining === 1);
				}
			})
		}
	});
	writeAPIStatus(APIStatus);
	return isLastTest;
};

let getLatencyInterval = (apiId) => {
	let intervalInMilli;
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			return intervalInMilli = Duration.fromISO(api.testConfig.latency.interval.iso8601format).valueOf();
		}
	});
	return intervalInMilli;
};

let getUptimeInterval = (apiId) => {
	let intervalInMilli;
	let APIStatus = getAPIStatus();
	APIStatus.some((api) => {
		if (api.id === apiId) {
			return intervalInMilli = Duration.fromISO(api.testConfig.uptime.interval.iso8601format).valueOf();
		}
	});
	return intervalInMilli;
};

let getAPI = (apiId) => {
	let APIStatus = getAPIStatus();
	let apiR;
	APIStatus.some(api => api.id === apiId ? apiR = api : false);
	return apiR;
};

let getServer = (apiId, serverName) => {
	let serverR;
	let api = getAPI(apiId);
	api.servers.some((server) => {
		if (server.name === serverName) {
			return serverR = server;
		}
	});
	return serverR;
};

let terminateServer = (apiId, serverName) => {
	applyFunctionToOneServer(apiId, serverName, (server) => {
		server.status = "Test completed";
	})
};

let applyFunctionToOneServer = (apiId, serverName, fn) => {
	let APIStatus = getAPIStatus();
	APIStatus.some(api => {
		if (api.id === apiId) {
			api.servers.some(server => {
				if (server.name === serverName) {
					fn(server);
				}
			})
		}
	});
	writeAPIStatus(APIStatus);
};

let recordAPIUpTime = (apiId, serverName, isApiUp, date) => {
	let APIStatus = getAPIStatus();
	APIStatus.some(api => {
		if (api.id === apiId) {
			if (api.uptimeResults[serverName]) {
				api.uptimeResults[serverName].push({date: date, state: isApiUp});
			} else {
				api.uptimeResults[serverName] = [];
				api.uptimeResults[serverName].push({date: date, state: isApiUp});
			}
		}
	});
	writeAPIStatus(APIStatus);
};

let getHTTPRequest = (apiId, httpRequestIndex) => {
	let APIStatus = getAPIStatus();
	return APIStatus.filter(api => api.id === apiId).map(api => api.httpRequests[httpRequestIndex])[0]
};

module.exports = {
	getAPIStatus: getAPIStatus,
	writeAPIStatus: writeAPIStatus,
	addApi: addApi,
	deleteApi: deleteApi,
	addOpenApiTestConfigToApi: addOpenApiTestConfigToApi,
	createServerInstanceFromOpenApiTestConfig: createServerInstanceFromOpenApiTestConfig,
	addServers: addServers,
	deleteServer: deleteServer,
	updateServerStatus: updateServerStatus,
	updateServerInfos: updateServerInfos,
	initializeServerState: initializeServerState,
	updateOperationTestResults: updateOperationTestResults,
	isLastTest: isLastTest,
	getLatencyInterval: getLatencyInterval,
	getUptimeInterval: getUptimeInterval,
	getAPI: getAPI,
	getServer: getServer,
	terminateServer: terminateServer,
	applyFunctionToOneServer: applyFunctionToOneServer,
	recordAPIUpTime: recordAPIUpTime,
	getHTTPRequest: getHTTPRequest
};
